from .base import *  # noqa: F403
from .base import REST_FRAMEWORK, env

DEBUG = env.bool("DJANGO_DEBUG", default=True)
ALLOWED_HOSTS = ["*"]

# Looser than prod's 5/min so local/E2E testing (parallel Playwright workers
# hitting login/signup from the same container IP) doesn't trip the
# brute-force guard. Every viewport project re-runs the full e2e suite
# against the same IP, so this needs enough headroom for that fan-out.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_THROTTLE_RATES": {"login": "100/min", "signup": "100/min"},
}
