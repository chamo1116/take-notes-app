from .base import *  # noqa: F403
from .base import REST_FRAMEWORK, env

DEBUG = env.bool("DJANGO_DEBUG", default=True)
ALLOWED_HOSTS = ["*"]

# Looser than prod's 5/min so local/E2E testing (parallel Playwright workers
# hitting login from the same container IP) doesn't trip the brute-force guard.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_THROTTLE_RATES": {"login": "20/min", "signup": "20/min"},
}
