import pytest
from pydantic import ValidationError
from schema import UserCreate, UserLogin, ChangePasswordRequest, PasswordRecoveryRequest, UserRole, UserStatus

def test_user_create_success():
    user = UserCreate(
        first_name="John",
        last_name="Doe",
        user_name="johndoe",
        email="john.doe@example.com",
        password="ValidPassw0rd!$3",
        roles=[UserRole.USER],  # Use the enum directly
        status=UserStatus.ACTIVE  # Use the enum directly
    )
    assert user.first_name == "John"
    assert user.email == "john.doe@example.com"
    assert user.status == UserStatus.ACTIVE  # Compare against the enum value


def test_user_create_invalid_email():
    with pytest.raises(ValidationError):
        UserCreate(
            first_name="John",
            last_name="Doe",
            user_name="johndoe",
            email="invalid-email",
            password="ValidPassw0rd!"
        )

def test_user_create_password_too_short():
    with pytest.raises(ValidationError):
        UserCreate(
            first_name="John",
            last_name="Doe",
            user_name="johndoe",
            email="john.doe@example.com",
            password="short",
        )

def test_user_create_invalid_password():
    with pytest.raises(ValidationError):
        UserCreate(
            first_name="John",
            last_name="Doe",
            user_name="johndoe",
            email="john.doe@example.com",
            password="password123",  # Missing required complexity
        )

def test_change_password_request_success():
    request = ChangePasswordRequest(
        user_id=1,
        current_password="CurrentPassword123!",
        new_password="NewValidPassword123!"
    )
    assert request.user_id == 1

def test_change_password_request_invalid_new_password():
    with pytest.raises(ValidationError):
        ChangePasswordRequest(
            user_id=1,
            current_password="CurrentPassword123!",
            new_password="short"  # Too short
        )

def test_password_recovery_request_success():
    request = PasswordRecoveryRequest(email="john.doe@example.com")
    assert request.email == "john.doe@example.com"

def test_password_recovery_request_invalid_email():
    with pytest.raises(ValidationError):
        PasswordRecoveryRequest(email="invalid-email")
