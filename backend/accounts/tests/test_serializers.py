import pytest
from rest_framework.exceptions import AuthenticationFailed

from accounts.models import User
from accounts.serializers import EmailTokenObtainPairSerializer, RegisterSerializer
from accounts.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


def test_valid_email_password_produces_tokens() -> None:
    UserFactory(email="jane@example.com")
    serializer = EmailTokenObtainPairSerializer(
        data={"email": "jane@example.com", "password": "testpass123"}
    )

    assert serializer.is_valid()
    assert "access" in serializer.validated_data
    assert "refresh" in serializer.validated_data


def test_invalid_password_fails_validation() -> None:
    UserFactory(email="jane@example.com")
    serializer = EmailTokenObtainPairSerializer(
        data={"email": "jane@example.com", "password": "wrongpass"}
    )

    with pytest.raises(AuthenticationFailed):
        serializer.is_valid(raise_exception=True)


def test_nonexistent_email_fails_validation() -> None:
    serializer = EmailTokenObtainPairSerializer(
        data={"email": "nobody@example.com", "password": "testpass123"}
    )

    with pytest.raises(AuthenticationFailed):
        serializer.is_valid(raise_exception=True)


def test_register_serializer_creates_user_with_hashed_password() -> None:
    serializer = RegisterSerializer(data={"email": "jane@example.com", "password": "testpass123"})

    assert serializer.is_valid(), serializer.errors
    user = serializer.save()

    assert isinstance(user, User)
    assert user.email == "jane@example.com"
    assert user.check_password("testpass123")


def test_register_serializer_rejects_duplicate_email() -> None:
    UserFactory(email="jane@example.com")
    serializer = RegisterSerializer(data={"email": "jane@example.com", "password": "testpass123"})

    assert not serializer.is_valid()
    assert "email" in serializer.errors


def test_register_serializer_rejects_duplicate_email_case_insensitively() -> None:
    # DRF's auto-generated UniqueValidator for the (unique=True) email field
    # only catches exact matches, so this relies on validate_email's explicit
    # iexact check to reject case-variant duplicates like "Jane@Example.com".
    UserFactory(email="jane@example.com")
    serializer = RegisterSerializer(data={"email": "Jane@Example.com", "password": "testpass123"})

    assert not serializer.is_valid()
    assert "email" in serializer.errors


def test_register_serializer_rejects_weak_password() -> None:
    serializer = RegisterSerializer(data={"email": "jane@example.com", "password": "password"})

    assert not serializer.is_valid()
    assert "password" in serializer.errors
