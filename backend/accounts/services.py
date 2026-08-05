"""Use cases for the accounts domain: registration and token issuance.

Views translate HTTP <-> Python and call these functions; these functions
own the business rules (user creation, JWT issuance, auth event logging)
so the same use case can't drift between call sites.
"""

import logging
from typing import TypedDict

from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User

logger = logging.getLogger(__name__)


class TokenPair(TypedDict):
    access: str
    refresh: str


def register_user(*, email: str, password: str) -> User:
    user = User.objects.create_user(email=email, password=password)
    logger.info("User signed up", extra={"user_id": user.id, "email": user.email})
    return user


def issue_tokens_for_user(user: User) -> TokenPair:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


def log_login_success(email: str | None) -> None:
    logger.info("User logged in", extra={"email": email})


def log_login_failure(email: str | None) -> None:
    logger.warning("Login failed: invalid credentials", extra={"email": email})
