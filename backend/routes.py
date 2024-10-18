from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import func, text
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database import get_db
from models import User, UserRole
from schema import UserCreate, UserResponse, UserLogin, ChangePasswordRequest, UserUpdate, PasswordRecoveryRequest, \
    ResetPasswordRequest
from auth import get_current_user, check_admin
import bcrypt
import secrets
import logging
from email_utils import send_recovery_email

router = APIRouter()


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


@router.get("/")
async def read_root():
    return {"message": "Hello from FastAPI!"}


@router.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        user_data = user.model_dump()
        user_data['hashed_password'] = hash_password(user_data.pop('password'))
        user_data['roles'] = ','.join([role.value for role in user_data['roles']])
        db_user = User(**user_data)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        db_user.roles = [UserRole(role) for role in db_user.roles.split(',')]
        return db_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username or email already exists")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/login")
def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_name == user_login.username).first()
    if not user or not verify_password(user_login.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {
        "message": "Login successful",
        "user_id": user.id,
        "roles": user.roles.split(',')
    }


@router.post("/change-password")
def change_password(request: ChangePasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(request.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if user.last_passwords is None:
        user.last_passwords = []

    for last_password in user.last_passwords:
        if verify_password(request.new_password, last_password):
            raise HTTPException(status_code=400, detail="You cannot use any of your last 5 passwords.")

    new_last_passwords = user.last_passwords + [user.hashed_password]
    new_last_passwords = new_last_passwords[-5:]
    user.hashed_password = hash_password(request.new_password)
    user.last_passwords = new_last_passwords + [user.hashed_password]

    db.query(User).filter(User.id == user.id).update(
        {"last_passwords": user.last_passwords},
        synchronize_session="fetch"
    )
    db.commit()

    logging.info(f"Password changed successfully for user {user.id}")
    return {"message": "Password changed successfully"}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_admin(current_user)
    user_to_delete = db.query(User).filter(User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    if user_to_delete.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    db.delete(user_to_delete)
    db.commit()
    return {"message": f"User {user_id} has been deleted successfully"}


@router.put("/users/{user_id}", response_model=UserResponse)
def edit_user(user_id: int, user_update: UserUpdate, current_user: User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.id != user_id and 'ADMIN' not in current_user.roles.split(','):
        raise HTTPException(status_code=403, detail="You don't have permission to edit this user")

    update_data = user_update.model_dump(exclude_unset=True)
    if 'ADMIN' not in current_user.roles.split(','):
        update_data.pop('roles', None)
        update_data.pop('status', None)

    for key, value in update_data.items():
        if key == 'roles' and value is not None:
            setattr(db_user, key, ','.join(value))
        else:
            setattr(db_user, key, value)

    try:
        db.commit()
        db.refresh(db_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username or email already exists")

    db_user.roles = db_user.roles.split(',') if db_user.roles else []
    return db_user


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == request.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    current_time = db.query(func.now()).scalar()
    if user.reset_token_expiry < current_time:
        raise HTTPException(status_code=400, detail="Reset token has expired")

    if user.last_passwords is None:
        user.last_passwords = []

    for last_password in user.last_passwords:
        if verify_password(request.new_password, last_password):
            raise HTTPException(status_code=400, detail="You cannot use any of your last 5 passwords.")

    new_last_passwords = user.last_passwords + [user.hashed_password]
    new_last_passwords = new_last_passwords[-5:]
    new_hashed_password = hash_password(request.new_password)
    new_last_passwords.append(new_hashed_password)

    db.query(User).filter(User.id == user.id).update({
        "hashed_password": new_hashed_password,
        "last_passwords": new_last_passwords,
        "reset_token": None,
        "reset_token_expiry": None
    }, synchronize_session="fetch")

    db.commit()
    logging.info(f"Password reset successfully for user {user.id}")
    return {"message": "Password reset successfully"}


@router.get("/verify-reset-token")
async def verify_reset_token(token: str, db: Session = Depends(get_db)):
    logging.info(f"Received token for verification: {token}")
    user = db.query(User).filter(User.reset_token == token).first()
    if not user:
        logging.warning(f"No user found with token: {token}")
        raise HTTPException(status_code=400, detail="Invalid reset token")

    current_time = db.query(func.now()).scalar()
    if user.reset_token_expiry < current_time:
        logging.warning(f"Token expired for user: {user.id}")
        raise HTTPException(status_code=400, detail="Reset token has expired")

    logging.info(f"Token valid for user: {user.id}")
    return {"message": "Token is valid", "user_id": user.id, "email": user.email}


@router.post("/password-recovery")
async def password_recovery(request: PasswordRecoveryRequest, background_tasks: BackgroundTasks,
                            db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        logging.warning(f"Password recovery requested for non-existent email: {request.email}")
        return {"message": "If the email exists, a recovery link will be sent."}

    token = secrets.token_urlsafe(32)
    logging.info(f"Generated token for user {user.id}: {token}")

    user.reset_token = token
    expiry_time = db.query(func.now() + text("INTERVAL 2 HOUR")).scalar()
    user.reset_token_expiry = expiry_time
    db.commit()

    db.refresh(user)
    logging.info(f"Token stored for user {user.id}. Stored token: {user.reset_token}")
    logging.info(f"Token expiry time: {user.reset_token_expiry}")

    background_tasks.add_task(send_recovery_email, user.email, token)
    return {"message": "If the email exists, a recovery link will be sent."}