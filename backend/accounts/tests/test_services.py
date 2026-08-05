import logging
from typing import cast

import pytest

from accounts import services
from accounts.models import User
from accounts.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


def test_register_user_creates_user_with_hashed_password() -> None:
    user = services.register_user(email="jane@example.com", password="testpass123")

    assert isinstance(user, User)
    assert user.email == "jane@example.com"
    assert user.check_password("testpass123")


def test_register_user_logs_signup(caplog: pytest.LogCaptureFixture) -> None:
    with caplog.at_level(logging.INFO, logger="accounts.services"):
        services.register_user(email="jane@example.com", password="testpass123")

    assert "User signed up" in caplog.text


def test_issue_tokens_for_user_returns_access_and_refresh() -> None:
    user = cast(User, UserFactory())

    tokens = services.issue_tokens_for_user(user)

    assert set(tokens) == {"access", "refresh"}
    assert isinstance(tokens["access"], str)
    assert isinstance(tokens["refresh"], str)


def test_log_login_success_logs_at_info(caplog: pytest.LogCaptureFixture) -> None:
    with caplog.at_level(logging.INFO, logger="accounts.services"):
        services.log_login_success("jane@example.com")

    assert "User logged in" in caplog.text


def test_log_login_failure_logs_at_warning(caplog: pytest.LogCaptureFixture) -> None:
    with caplog.at_level(logging.WARNING, logger="accounts.services"):
        services.log_login_failure("jane@example.com")

    assert "Login failed" in caplog.text
