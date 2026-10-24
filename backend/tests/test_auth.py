"""F1 — accounts: register, login, rotating refresh tokens, password flows."""

from datetime import UTC, datetime, timedelta

import jwt
from sqlalchemy import update

from core.config import settings
from core.database import async_session_factory
from models.refresh_token import RefreshToken
from models.user import User
from tests.conftest import TestClient

REGISTER = {
    "username": "nila",
    "email": "nila@example.com",
    "display_name": "Nila",
    "password": "correct-horse-1",
}


# ── register ──────────────────────────────────────────────────────────
async def test_register_returns_a_session_and_never_the_password(client: TestClient) -> None:
    resp = await client.post("/auth/register", json=REGISTER)
    assert resp.status_code == 201
    body = resp.json()
    assert body["access_token"] and body["refresh_token"]
    assert body["user"]["username"] == "nila"
    assert "password" not in resp.text and "password_hash" not in resp.text


async def test_register_rejects_duplicate_email_and_username(client: TestClient) -> None:
    await client.post("/auth/register", json=REGISTER)

    same_email = {**REGISTER, "username": "other"}
    resp = await client.post("/auth/register", json=same_email)
    assert resp.status_code == 409

    same_username = {**REGISTER, "email": "other@example.com"}
    resp = await client.post("/auth/register", json=same_username)
    assert resp.status_code == 409


async def test_register_validates_input(client: TestClient) -> None:
    short = await client.post("/auth/register", json={**REGISTER, "password": "short"})
    assert short.status_code == 422
    bad_name = await client.post("/auth/register", json={**REGISTER, "username": "no spaces!"})
    assert bad_name.status_code == 422
    bad_email = await client.post("/auth/register", json={**REGISTER, "email": "not-an-email"})
    assert bad_email.status_code == 422


# ── login ─────────────────────────────────────────────────────────────
async def test_login_succeeds_with_correct_credentials(client: TestClient) -> None:
    await client.post("/auth/register", json=REGISTER)
    resp = await client.post(
        "/auth/login", json={"email": REGISTER["email"], "password": REGISTER["password"]}
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]


async def test_login_failure_does_not_reveal_whether_the_email_exists(client: TestClient) -> None:
    await client.post("/auth/register", json=REGISTER)
    wrong_password = await client.post(
        "/auth/login", json={"email": REGISTER["email"], "password": "wrong-password"}
    )
    unknown_email = await client.post(
        "/auth/login", json={"email": "nobody@example.com", "password": "wrong-password"}
    )
    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()


async def test_suspended_account_cannot_log_in(client: TestClient, make_user) -> None:
    acct = await make_user("sam")
    await _suspend(acct.id)
    resp = await client.post("/auth/login", json={"email": acct.email, "password": acct.password})
    assert resp.status_code == 403
    assert "suspended" in resp.json()["detail"].lower()


async def test_suspension_also_cuts_off_an_existing_access_token(
    client: TestClient, make_user
) -> None:
    acct = await make_user("sam")
    assert (await client.get("/auth/me", acct.access)).status_code == 200
    await _suspend(acct.id)
    assert (await client.get("/auth/me", acct.access)).status_code == 403


async def test_me_requires_a_valid_token(client: TestClient, make_user) -> None:
    acct = await make_user()
    assert (await client.get("/auth/me")).status_code == 401
    assert (await client.get("/auth/me", "garbage")).status_code == 401
    ok = await client.get("/auth/me", acct.access)
    assert ok.status_code == 200
    assert ok.json()["email"] == acct.email


# ── refresh-token rotation ────────────────────────────────────────────
async def test_refresh_rotates_the_token_pair(client: TestClient, make_user) -> None:
    acct = await make_user()
    resp = await client.post("/auth/refresh", json={"refresh_token": acct.refresh})
    assert resp.status_code == 200
    new = resp.json()
    assert new["refresh_token"] != acct.refresh
    assert (await client.get("/auth/me", new["access_token"])).status_code == 200


async def test_a_used_refresh_token_cannot_be_used_again(client: TestClient, make_user) -> None:
    acct = await make_user()
    await client.post("/auth/refresh", json={"refresh_token": acct.refresh})
    again = await client.post("/auth/refresh", json={"refresh_token": acct.refresh})
    assert again.status_code == 401


async def test_reusing_a_rotated_token_revokes_the_whole_session(
    client: TestClient, make_user
) -> None:
    acct = await make_user()
    rotated = (await client.post("/auth/refresh", json={"refresh_token": acct.refresh})).json()

    # Replaying the old token is treated as theft ...
    assert (
        await client.post("/auth/refresh", json={"refresh_token": acct.refresh})
    ).status_code == 401
    # ... so the legitimately rotated token is dead too.
    after = await client.post("/auth/refresh", json={"refresh_token": rotated["refresh_token"]})
    assert after.status_code == 401


async def test_expired_refresh_token_is_rejected(client: TestClient, make_user) -> None:
    acct = await make_user()
    async with async_session_factory() as db:
        await db.execute(
            update(RefreshToken).values(expires_at=datetime.now(UTC) - timedelta(seconds=1))
        )
        await db.commit()
    resp = await client.post("/auth/refresh", json={"refresh_token": acct.refresh})
    assert resp.status_code == 401


async def test_unknown_refresh_token_is_rejected(client: TestClient) -> None:
    resp = await client.post("/auth/refresh", json={"refresh_token": "rt-does-not-exist"})
    assert resp.status_code == 401


async def test_suspended_user_cannot_refresh(client: TestClient, make_user) -> None:
    acct = await make_user()
    await _suspend(acct.id)
    resp = await client.post("/auth/refresh", json={"refresh_token": acct.refresh})
    assert resp.status_code == 401


async def test_logout_revokes_the_refresh_token_and_is_idempotent(
    client: TestClient, make_user
) -> None:
    acct = await make_user()
    assert (
        await client.post("/auth/logout", json={"refresh_token": acct.refresh})
    ).status_code == 200
    assert (
        await client.post("/auth/logout", json={"refresh_token": acct.refresh})
    ).status_code == 200
    resp = await client.post("/auth/refresh", json={"refresh_token": acct.refresh})
    assert resp.status_code == 401


# ── change password ───────────────────────────────────────────────────
async def test_change_password_requires_the_current_password(client: TestClient, make_user) -> None:
    acct = await make_user()
    wrong = await client.post(
        "/auth/change-password",
        acct.access,
        json={"current_password": "not-it", "new_password": "a-new-password-1"},
    )
    assert wrong.status_code == 401

    ok = await client.post(
        "/auth/change-password",
        acct.access,
        json={"current_password": acct.password, "new_password": "a-new-password-1"},
    )
    assert ok.status_code == 200

    old = await client.post("/auth/login", json={"email": acct.email, "password": acct.password})
    new = await client.post(
        "/auth/login", json={"email": acct.email, "password": "a-new-password-1"}
    )
    assert old.status_code == 401
    assert new.status_code == 200


# ── password reset ────────────────────────────────────────────────────
async def test_forgot_password_answers_the_same_for_known_and_unknown_emails(
    client: TestClient, make_user
) -> None:
    acct = await make_user()
    known = await client.post("/auth/forgot-password", json={"email": acct.email})
    unknown = await client.post("/auth/forgot-password", json={"email": "ghost@example.com"})
    assert known.status_code == unknown.status_code == 202
    assert known.json() == unknown.json()


async def test_reset_password_with_a_valid_token(client: TestClient, make_user) -> None:
    acct = await make_user()
    token = await _reset_token(acct.id)
    resp = await client.post(
        "/auth/reset-password", json={"token": token, "password": "brand-new-pass-1"}
    )
    assert resp.status_code == 200
    login = await client.post(
        "/auth/login", json={"email": acct.email, "password": "brand-new-pass-1"}
    )
    assert login.status_code == 200


async def test_reset_link_is_single_use(client: TestClient, make_user) -> None:
    acct = await make_user()
    token = await _reset_token(acct.id)
    first = await client.post(
        "/auth/reset-password", json={"token": token, "password": "first-pass-123"}
    )
    second = await client.post(
        "/auth/reset-password", json={"token": token, "password": "second-pass-123"}
    )
    assert first.status_code == 200
    assert second.status_code == 400
    login = await client.post(
        "/auth/login", json={"email": acct.email, "password": "first-pass-123"}
    )
    assert login.status_code == 200


async def test_reset_rejects_invalid_expired_and_wrong_purpose_tokens(
    client: TestClient, make_user
) -> None:
    acct = await make_user()
    body = {"password": "brand-new-pass-1"}
    # A real token's fingerprint, so each forged token below is wrong in exactly one way.
    fingerprint = jwt.decode(
        await _reset_token(acct.id), settings.jwt_secret, algorithms=[settings.jwt_algorithm]
    )["pv"]

    assert (
        await client.post("/auth/reset-password", json={**body, "token": "junk"})
    ).status_code == 400

    def forge(**claims) -> str:
        payload = {"sub": acct.id, "purpose": "reset", "pv": fingerprint, **claims}
        return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

    expired = forge(exp=datetime.now(UTC) - timedelta(minutes=1))
    assert (
        await client.post("/auth/reset-password", json={**body, "token": expired})
    ).status_code == 400

    wrong_purpose = forge(exp=datetime.now(UTC) + timedelta(minutes=5), purpose="access")
    assert (
        await client.post("/auth/reset-password", json={**body, "token": wrong_purpose})
    ).status_code == 400


# ── profile ───────────────────────────────────────────────────────────
async def test_profile_update_and_username_uniqueness(client: TestClient, make_user) -> None:
    first = await make_user("first")
    await make_user("second")

    ok = await client.patch(
        "/auth/me", first.access, json={"display_name": "First One", "bio": "hello"}
    )
    assert ok.status_code == 200
    assert ok.json()["display_name"] == "First One"

    taken = await client.patch("/auth/me", first.access, json={"username": "second"})
    assert taken.status_code == 409


async def _reset_token(user_id: str) -> str:
    import uuid

    from core.security.tokens import create_reset_token

    async with async_session_factory() as db:
        user = await db.get(User, uuid.UUID(user_id))
        assert user is not None
        return create_reset_token(user)


async def _suspend(user_id: str) -> None:
    import uuid

    async with async_session_factory() as db:
        await db.execute(update(User).where(User.id == uuid.UUID(user_id)).values(is_active=False))
        await db.commit()
