import pytest

from accounts.models import User

pytestmark = pytest.mark.django_db


def test_create_user_with_email_succeeds() -> None:
    user = User.objects.create_user(email="jane@example.com", password="testpass123")

    assert user.email == "jane@example.com"
    assert user.check_password("testpass123")
    assert user.is_active is True
    assert user.is_staff is False


def test_create_user_without_email_raises() -> None:
    with pytest.raises(ValueError, match="email"):
        User.objects.create_user(email="", password="testpass123")


def test_email_is_normalized() -> None:
    user = User.objects.create_user(email="jane@EXAMPLE.com", password="testpass123")

    assert user.email == "jane@example.com"


def test_create_superuser_sets_flags() -> None:
    user = User.objects.create_superuser(email="admin@example.com", password="testpass123")

    assert user.is_staff is True
    assert user.is_superuser is True


def test_create_superuser_rejects_is_staff_false() -> None:
    with pytest.raises(ValueError, match="is_staff"):
        User.objects.create_superuser(
            email="admin@example.com", password="testpass123", is_staff=False
        )


def test_create_superuser_rejects_is_superuser_false() -> None:
    with pytest.raises(ValueError, match="is_superuser"):
        User.objects.create_superuser(
            email="admin@example.com", password="testpass123", is_superuser=False
        )


def test_user_str_returns_email() -> None:
    user = User.objects.create_user(email="jane@example.com", password="testpass123")

    assert str(user) == "jane@example.com"
