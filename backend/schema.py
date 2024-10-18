
from pydantic import BaseModel, EmailStr, Field, constr, field_validator
from datetime import datetime
from models import UserStatus, UserRole
from typing import Optional, List
import re

class UserBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    user_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr

class UserCreate(UserBase):
    password: constr(min_length=16)  # Enforce minimum length
    roles: List[UserRole] = Field(default=[UserRole.USER])
    status: UserStatus = Field(default=UserStatus.PENDING)

    @field_validator('password')
    def validate_password(cls, v):
        if (not re.search(r'[A-Z]', v) or
                not re.search(r'[a-z]', v) or
                not re.search(r'[0-9]', v) or
                not re.search(r'[@$!%*?&]', v)):  # Adjust special characters as needed
            raise ValueError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.')
        return v

class UserResponse(UserBase):
    id: int
    status: UserStatus
    roles: List[UserRole]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class ChangePasswordRequest(BaseModel):
    user_id: int
    current_password: str
    new_password: constr(min_length=16)  # Enforce minimum length of 16 characters

    @field_validator('new_password')
    def validate_new_password(cls, v):
        if (not re.search(r'[A-Z]', v) or
                not re.search(r'[a-z]', v) or
                not re.search(r'[0-9]', v) or
                not re.search(r'[@$!%*?&]', v)):  # Adjust special characters as needed
            raise ValueError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.')
        return v

class TokenData(BaseModel):
    username: Optional[str] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    status: Optional[UserStatus] = None
    roles: Optional[List[UserRole]] = None

    class Config:
        use_enum_values = True

class PasswordRecoveryRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: constr(min_length=16)

    @field_validator('new_password')
    def validate_new_password(cls, v):
        if (not re.search(r'[A-Z]', v) or
                not re.search(r'[a-z]', v) or
                not re.search(r'[0-9]', v) or
                not re.search(r'[@$!%*?&]', v)):  # Adjust special characters as needed
            raise ValueError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.')
        return v
