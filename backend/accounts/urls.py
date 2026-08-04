from django.urls import path

from accounts.views import EmailTokenObtainPairView, RefreshTokenView, RegisterView

urlpatterns = [
    path("auth/login/", EmailTokenObtainPairView.as_view(), name="login"),
    path("auth/signup/", RegisterView.as_view(), name="signup"),
    path("auth/refresh/", RefreshTokenView.as_view(), name="token_refresh"),
]
