"""Profile extras: avatar upload and the status line."""

from datetime import UTC, datetime, timedelta

from sqlalchemy import update

from core.database import async_session_factory
from models.user import User
from tests.conftest import TestClient
from tests.test_emotes import gif, png


async def test_avatar_upload_replace_and_remove(client: TestClient, make_user) -> None:
    who = await make_user("avatar")

    async def upload(data: bytes, name: str = "a.png"):
        return await client.post(
            "/auth/me/avatar", who.access, files={"file": (name, data, "image/png")}
        )

    first = (await upload(png(64, 64))).json()["avatar_url"]
    assert first.startswith(f"/api/avatars/{who.id}/")
    served = await client.get(first.removeprefix("/api"))
    assert served.status_code == 200 and served.headers["content-type"] == "image/png"

    second = (await upload(png(80, 80))).json()["avatar_url"]
    assert second != first
    assert (await client.get(first.removeprefix("/api"))).status_code == 404

    assert (await client.get("/auth/me", who.access)).json()["avatar_url"] == second
    removed = await client.delete("/auth/me/avatar", who.access)
    assert removed.json()["avatar_url"] is None
    assert (await client.get(second.removeprefix("/api"))).status_code == 404


async def test_avatar_is_validated_by_its_bytes(client: TestClient, make_user) -> None:
    who = await make_user("avatar2")
    up = lambda data: client.post(  # noqa: E731
        "/auth/me/avatar", who.access, files={"file": ("a.png", data, "image/png")}
    )
    assert (await up(b"not an image at all")).status_code == 400
    assert (await up(gif())).status_code == 400  # gif is not allowed for pictures
    assert (await up(png(2100, 10))).status_code == 400  # too many pixels
    assert (await up(png(8, 8) + b"\0" * (2 * 1024 * 1024))).status_code == 400  # too big
    assert (
        await client.post("/auth/me/avatar", files={"file": ("a.png", png())})
    ).status_code == 401


async def test_status_set_replace_and_clear(client: TestClient, make_user) -> None:
    who = await make_user("statused")
    assert (await client.get("/auth/me", who.access)).json()["status"] is None

    set_ = await client.put(
        "/auth/me/status", who.access, json={"emoji": "☕", "text": "Back at 6", "expires": "hour"}
    )
    assert set_.status_code == 200
    status = set_.json()["status"]
    assert status["emoji"] == "☕" and status["text"] == "Back at 6" and status["expires_at"]

    only_text = await client.put("/auth/me/status", who.access, json={"text": " Heads down "})
    assert only_text.json()["status"] == {"emoji": None, "text": "Heads down", "expires_at": None}

    cleared = await client.delete("/auth/me/status", who.access)
    assert cleared.json()["status"] is None


async def test_status_rules(client: TestClient, make_user) -> None:
    who = await make_user("statused2")
    put = lambda body, token=who.access: client.put(  # noqa: E731
        "/auth/me/status", token, json=body
    )
    assert (await put({})).status_code == 422  # nothing to show
    assert (await put({"text": "   "})).status_code == 422
    assert (await put({"text": "x" * 81})).status_code == 422
    assert (await put({"text": "hi", "expires": "someday"})).status_code == 422
    assert (await put({"text": "hi"}, None)).status_code == 401

    # A status past its end time reads as unset.
    await put({"text": "away", "expires": "week"})
    async with async_session_factory() as db:
        await db.execute(
            update(User).values(status_expires_at=datetime.now(UTC) - timedelta(minutes=1))
        )
        await db.commit()
    assert (await client.get("/auth/me", who.access)).json()["status"] is None
