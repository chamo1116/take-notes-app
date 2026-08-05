from .base import *  # noqa: F403
from .base import env

DEBUG = False
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")
SECURE_SSL_REDIRECT = True
# Vercel terminates TLS at the edge and forwards requests to the function
# over a plain connection, so request.is_secure() is False unless Django
# is told which header carries the original scheme — without this every
# request (including internal service-to-service calls) gets redirected.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# One year, as recommended by Django's deploy checklist (manage.py check
# --deploy) and required before enabling preload/subdomains.
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
