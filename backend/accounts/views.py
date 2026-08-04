import logging
from typing import Any

from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.models import User
from accounts.serializers import EmailTokenObtainPairSerializer, RegisterSerializer

logger = logging.getLogger(__name__)


class EmailTokenObtainPairView(TokenObtainPairView):
    # simplejwt ships no type stubs, so these overrides read as incompatible
    # against the untyped base class attributes under mypy --strict.
    serializer_class = EmailTokenObtainPairSerializer
    permission_classes = [AllowAny]  # type: ignore[assignment]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        email = request.data.get("email")
        try:
            response = super().post(request, *args, **kwargs)
        except AuthenticationFailed:
            logger.warning("Login failed: invalid credentials", extra={"email": email})
            raise
        logger.info("User logged in", extra={"email": email})
        return response


class RefreshTokenView(TokenRefreshView):
    permission_classes = [AllowAny]  # type: ignore[assignment]


class RegisterView(CreateAPIView[User]):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "signup"

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            logger.warning(
                "Signup rejected",
                extra={"email": request.data.get("email"), "errors": serializer.errors},
            )
            raise
        user = serializer.save()
        logger.info("User signed up", extra={"user_id": user.id, "email": user.email})

        # Log the new user straight in, same as the login endpoint, so the
        # frontend can send them to the dashboard without a second request.
        refresh = RefreshToken.for_user(user)
        return Response(
            {"access": str(refresh.access_token), "refresh": str(refresh)},
            status=status.HTTP_201_CREATED,
        )
