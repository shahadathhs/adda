"""Google OAuth 2.0 — verifies ID tokens using Google's public JWKS."""

from typing import Any

import jwt
from jwt import PyJWKClient

from core.config import settings

# PyJWKClient fetches + caches Google's signing keys (rotated automatically).
_jwk_client = PyJWKClient("https://www.googleapis.com/oauth2/v3/certs")

_GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}


def verify_google_id_token(id_token: str) -> dict[str, Any] | None:
    """Verify a Google ID token and return its claims, or None if invalid.

    Requires `google_client_id` to be configured; validates the signature
    (via JWKS), the audience (`aud`), the issuer, and expiry.
    """
    if not settings.google_client_id:
        return None
    try:
        signing_key = _jwk_client.get_signing_key_from_jwt(id_token)
        payload = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.google_client_id,
        )
    except Exception:
        return None

    if payload.get("iss") not in _GOOGLE_ISSUERS:
        return None
    if not payload.get("email_verified"):
        return None
    return payload
