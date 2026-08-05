from django.urls import path

from accounts.views import EmailTokenObtainPairView, RefreshTokenView, RegisterView

urlpatterns = [
    # No trailing slash: Vercel's internal service-binding network strips it
    # from the path before it reaches Django, so a slash-requiring pattern
    # here would 301 (APPEND_SLASH) back to the same URL forever.
    path("auth/login", EmailTokenObtainPairView.as_view(), name="login"),
    path("auth/signup", RegisterView.as_view(), name="signup"),
    path("auth/refresh", RefreshTokenView.as_view(), name="token_refresh"),
]
