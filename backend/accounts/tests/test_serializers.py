import pytest
from rest_framework.exceptions import AuthenticationFailed

from accounts.serializers import EmailTokenObtainPairSerializer
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
