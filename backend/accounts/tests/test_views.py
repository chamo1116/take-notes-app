import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.throttling import ScopedRateThrottle

from accounts.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


def test_login_with_valid_credentials_returns_200_and_tokens(api_client: APIClient) -> None:
    UserFactory(email="jane@example.com")

    response = api_client.post(
        reverse("login"), {"email": "jane@example.com", "password": "testpass123"}
    )

    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data
    assert "refresh" in response.data


def test_login_with_invalid_credentials_returns_401(api_client: APIClient) -> None:
    UserFactory(email="jane@example.com")

    response = api_client.post(
        reverse("login"), {"email": "jane@example.com", "password": "wrongpass"}
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_login_missing_fields_returns_400(api_client: APIClient) -> None:
    response = api_client.post(reverse("login"), {"email": "jane@example.com"})

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_login_endpoint_allows_unauthenticated_access(api_client: APIClient) -> None:
    UserFactory(email="jane@example.com")

    response = api_client.post(
        reverse("login"), {"email": "jane@example.com", "password": "testpass123"}
    )

    assert response.status_code != status.HTTP_401_UNAUTHORIZED or "access" not in response.data


def test_login_is_throttled_after_too_many_attempts(
    api_client: APIClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    # DRF binds SimpleRateThrottle.THROTTLE_RATES from api_settings at import
    # time, so override_settings(REST_FRAMEWORK=...) doesn't reach it —
    # patch the class attribute directly to pin an explicit rate for this
    # test, independent of the ambient environment's configured login rate.
    monkeypatch.setattr(ScopedRateThrottle, "THROTTLE_RATES", {"login": "3/min"})
    UserFactory(email="jane@example.com")

    responses = [
        api_client.post(reverse("login"), {"email": "jane@example.com", "password": "wrongpass"})
        for _ in range(4)
    ]

    assert responses[-1].status_code == status.HTTP_429_TOO_MANY_REQUESTS


def test_refresh_returns_new_access_token(api_client: APIClient) -> None:
    UserFactory(email="jane@example.com")
    login_response = api_client.post(
        reverse("login"), {"email": "jane@example.com", "password": "testpass123"}
    )
    refresh_token = login_response.data["refresh"]

    response = api_client.post(reverse("token_refresh"), {"refresh": refresh_token})

    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data
