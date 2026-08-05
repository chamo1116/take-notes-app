from collections.abc import Callable

from django.http import HttpRequest, HttpResponse

INTERNAL_SERVICE_HOST_SUFFIX = ".services.vercel-infra.com"


class TrustInternalServiceMiddleware:
    """Mark requests to Vercel's internal service-binding hostname as secure.

    That hostname is only reachable from Vercel's private internal network
    (never the public internet), but calls made over it don't pass through
    the public edge that normally sets X-Forwarded-Proto, so
    SECURE_PROXY_SSL_HEADER has nothing to check and SecurityMiddleware's
    SECURE_SSL_REDIRECT ends up redirecting internal traffic in a loop. This
    must run before SecurityMiddleware in the chain.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        # get_host() can include a port (e.g. "host:443"), which would never
        # match a hostname suffix check.
        host = request.get_host().split(":", 1)[0]
        if host.endswith(INTERNAL_SERVICE_HOST_SUFFIX):
            request.META["HTTP_X_FORWARDED_PROTO"] = "https"
        return self.get_response(request)
