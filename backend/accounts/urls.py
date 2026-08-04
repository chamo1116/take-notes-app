from django.urls import path

from accounts.views import EmailTokenObtainPairView, RefreshTokenView

urlpatterns = [
    path("auth/login/", EmailTokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", RefreshTokenView.as_view(), name="token_refresh"),
]
