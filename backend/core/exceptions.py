"""Centralized HTTP exceptions.

Each is an `HTTPException` subclass, so FastAPI renders it automatically as the
standard `{"detail": ...}` error body. Raise them directly in handlers and
services for consistent, typed error responses:

    if community is None:
        raise NotFoundException("Community not found")
    raise ConflictException("Slug already taken")

Add a new kind by subclassing `APIException` and setting `status_code`.
"""

from fastapi import HTTPException, status


class APIException(HTTPException):
    """Base for all application exceptions.

    Subclasses declare a class-level `status_code` and `default_detail`.
    Callers may override the detail and attach response headers (e.g. the
    `WWW-Authenticate` header on a 401).
    """

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail: str = "Something went wrong"

    def __init__(
        self,
        detail: str | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        super().__init__(
            status_code=self.status_code,
            detail=detail or self.default_detail,
            headers=headers,
        )


# ── 4xx client errors ────────────────────────────────────────────────
class BadRequestException(APIException):
    """400 — malformed or invalid request."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Bad request"


class UnauthorizedException(APIException):
    """401 — missing or invalid credentials."""

    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = "Authentication required"


class ForbiddenException(APIException):
    """403 — authenticated but not permitted."""

    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "Forbidden"


class NotFoundException(APIException):
    """404 — resource does not exist."""

    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Not found"


class ConflictException(APIException):
    """409 — request conflicts with current state (duplicate, already member)."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "Conflict"


class GoneException(APIException):
    """410 — resource existed but is no longer available."""

    status_code = status.HTTP_410_GONE
    default_detail = "Resource no longer available"


class UnprocessableEntityException(APIException):
    """422 — semantically invalid payload (well-formed but unprocessable)."""

    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    default_detail = "Unprocessable entity"


class RateLimitException(APIException):
    """429 — too many requests in a given window."""

    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = "Too many requests"


# ── 5xx server errors ────────────────────────────────────────────────
class InternalServerError(APIException):
    """500 — unexpected server failure."""

    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = "Internal server error"


class BadGatewayException(APIException):
    """502 — an upstream service (e.g. mediamtx) returned an invalid response."""

    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = "Bad gateway"


class ServiceUnavailableException(APIException):
    """503 — the service or a dependency is temporarily unavailable."""

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Service unavailable"
