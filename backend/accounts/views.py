from rest_framework.permissions import AllowAny
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.serializers import EmailTokenObtainPairSerializer


class EmailTokenObtainPairView(TokenObtainPairView):
    # simplejwt ships no type stubs, so these overrides read as incompatible
    # against the untyped base class attributes under mypy --strict.
    serializer_class = EmailTokenObtainPairSerializer
    permission_classes = [AllowAny]  # type: ignore[assignment]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class RefreshTokenView(TokenRefreshView):
    permission_classes = [AllowAny]  # type: ignore[assignment]
