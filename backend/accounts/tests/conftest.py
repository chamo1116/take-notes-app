import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def _clear_throttle_cache() -> None:
    """DRF throttles persist state in the cache across tests otherwise."""
    cache.clear()
