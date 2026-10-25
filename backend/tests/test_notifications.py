"""F13: the bell, preferences, went-live alerts and the optional email."""

import pytest

from tests.conftest import Account, TestClient


async def _channel(client: TestClient, owner: Account, slug: str = "bell") -> str:
    resp = await client.post("/communities", owner.access, json={"name": "Bell", "slug": slug})
    return resp.json()["id"]


async def _went_live(cid: str) -> int:
    import uuid

    from core.database import async_session_factory
    from models.community import Community
    from modules.notifications.service.notify import notify_went_live

    async with async_session_factory() as db:
        community = await db.get(Community, uuid.UUID(cid))
        assert community is not None
        return await notify_went_live(db, community)


async def test_going_live_rings_the_bell_for_followers_only(client: TestClient, make_user) -> None:
    owner, fan, stranger = (
        await make_user("owner"),
        await make_user("fan"),
        await make_user("other"),
    )
    cid = await _channel(client, owner)
    await client.post(f"/communities/{cid}/follow", fan.access)

    assert await _went_live(cid) == 1
    inbox = (await client.get("/notifications", fan.access)).json()
    assert inbox["unread"] == 1 and inbox["items"][0]["kind"] == "went_live"
    assert inbox["items"][0]["payload"]["community_slug"] == "bell"
    assert (await client.get("/notifications", stranger.access)).json()["items"] == []
    assert (await client.get("/notifications", owner.access)).json()["items"] == []
    assert (await client.get("/notifications")).status_code == 401


async def test_mark_read_for_some_or_all(client: TestClient, make_user) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    await client.post(f"/communities/{cid}/follow", fan.access)
    for _ in range(3):
        await _went_live(cid)
    items = (await client.get("/notifications", fan.access)).json()["items"]

    one = await client.post("/notifications/read", fan.access, json={"ids": [items[0]["id"]]})
    assert one.json()["unread"] == 2
    everything = await client.post("/notifications/read", fan.access, json={})
    assert everything.json()["unread"] == 0
    assert all(n["read"] for n in (await client.get("/notifications", fan.access)).json()["items"])


async def test_you_cannot_mark_someone_elses_notifications_read(
    client: TestClient, make_user
) -> None:
    owner, fan, other = await make_user("owner"), await make_user("fan"), await make_user("other")
    cid = await _channel(client, owner)
    await client.post(f"/communities/{cid}/follow", fan.access)
    await _went_live(cid)
    note = (await client.get("/notifications", fan.access)).json()["items"][0]
    await client.post("/notifications/read", other.access, json={"ids": [note["id"]]})
    assert (await client.get("/notifications", fan.access)).json()["unread"] == 1


async def test_turning_the_bell_off_for_one_channel(client: TestClient, make_user) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    quiet, loud = await _channel(client, owner, "quiet"), await _channel(client, owner, "loud")
    for cid in (quiet, loud):
        await client.post(f"/communities/{cid}/follow", fan.access)
    resp = await client.put(
        "/me/notification-prefs", fan.access, json={"community_id": quiet, "bell": False}
    )
    assert resp.status_code == 200 and resp.json()["bell"] is False

    assert await _went_live(quiet) == 0
    assert await _went_live(loud) == 1
    prefs = (await client.get("/me/notification-prefs", fan.access)).json()
    by_name = {c["community_name"]: c for c in prefs["channels"]}
    assert by_name["Bell"]["bell"] in (True, False) and len(prefs["channels"]) == 2


async def test_the_account_default_applies_unless_a_channel_overrides_it(
    client: TestClient, make_user
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    await client.post(f"/communities/{cid}/follow", fan.access)
    await client.put("/me/notification-prefs", fan.access, json={"bell": False})
    assert await _went_live(cid) == 0
    await client.put("/me/notification-prefs", fan.access, json={"community_id": cid, "bell": True})
    assert await _went_live(cid) == 1


async def test_email_controls_are_unavailable_without_smtp(client: TestClient, make_user) -> None:
    fan = await make_user("fan")
    prefs = (await client.get("/me/notification-prefs", fan.access)).json()
    assert prefs["email_available"] is False
    refused = await client.put("/me/notification-prefs", fan.access, json={"email": True})
    assert refused.status_code == 400


async def test_live_email_is_opt_in_and_sent_at_most_once_an_hour(
    client: TestClient, make_user, monkeypatch: pytest.MonkeyPatch
) -> None:
    owner, fan, quiet = await make_user("owner"), await make_user("fan"), await make_user("quiet")
    cid = await _channel(client, owner)
    for who in (fan, quiet):
        await client.post(f"/communities/{cid}/follow", who.access)

    monkeypatch.setattr("core.config.settings.smtp_host", "smtp.test")
    sent: list[str] = []

    async def fake_send(to: str, subject: str, html: str, text: str) -> None:
        sent.append(to)

    monkeypatch.setattr("modules.notifications.service.notify.send_email", fake_send)
    assert (
        await client.put("/me/notification-prefs", fan.access, json={"email": True})
    ).status_code == 200

    await _went_live(cid)
    await _went_live(cid)  # a second live event inside the hour
    assert sent == ["fan@example.com"]  # only the opted-in account, and only once
    assert (await client.get("/notifications", quiet.access)).json()["unread"] == 2  # bell is on

    from core.redis_client import redis_client

    await redis_client.flushall()  # the hour is up
    await _went_live(cid)
    assert sent == ["fan@example.com", "fan@example.com"]
