"""F9 guests are read-only; F14 identity mode hides the author on the wire, not in the database."""

import json
import uuid

import pytest
from sqlalchemy import select
from websockets.asyncio.client import connect
from websockets.exceptions import InvalidStatus

from tests.conftest import Account, TestClient
from tests.test_gateway_chat import _join, _recv


async def _channel(client: TestClient, owner: Account, slug: str = "ch-id") -> str:
    resp = await client.post("/communities", owner.access, json={"name": "Ch", "slug": slug})
    return resp.json()["id"]


async def _say(ws, cid: str, content: str) -> None:
    await ws.send(
        json.dumps(
            {
                "type": "chat_message",
                "channel": f"community/{cid}/chat",
                "data": {"content": content},
            }
        )
    )


# ── guests ────────────────────────────────────────────────────────────
async def test_a_guest_can_read_live_chat_but_never_write(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    topic = f"community/{cid}/chat"

    guest = await connect(f"{ws_url}/ws")
    await guest.send(json.dumps({"type": "subscribe", "channel": topic}))
    await _recv(guest, "subscribed")

    member = await _join(ws_url, fan, cid)
    await _say(member, cid, "hi guests")
    assert (await _recv(guest, "chat_message"))["data"]["content"] == "hi guests"

    await _say(guest, cid, "let me in")
    err = await _recv(guest, "error")
    assert err["data"]["code"] == "auth_required"
    history = (await client.get(f"/communities/{cid}/messages")).json()
    assert [m["content"] for m in history] == ["hi guests"]
    await guest.close()
    await member.close()


async def test_a_guest_cannot_listen_on_a_personal_channel(
    client: TestClient, make_user, ws_url: str
) -> None:
    fan = await make_user("fan")
    guest = await connect(f"{ws_url}/ws")
    await guest.send(json.dumps({"type": "subscribe", "channel": f"user/{fan.id}"}))
    assert (await _recv(guest, "error"))["data"]["code"] == "forbidden"
    await guest.close()


async def test_an_account_cannot_listen_on_someone_elses_personal_channel(
    make_user, ws_url: str
) -> None:
    a, b = await make_user("aaa"), await make_user("bbb")
    ws = await connect(f"{ws_url}/ws?token={a.access}")
    await ws.send(json.dumps({"type": "subscribe", "channel": f"user/{b.id}"}))
    assert (await _recv(ws, "error"))["data"]["code"] == "forbidden"
    await ws.close()


async def test_a_bad_token_is_refused_rather_than_treated_as_a_guest(ws_url: str) -> None:
    with pytest.raises(InvalidStatus) as refused:
        await connect(f"{ws_url}/ws?token=garbage")
    assert refused.value.response.status_code == 403


# ── identity mode ─────────────────────────────────────────────────────
async def test_identity_mode_defaults_to_named_and_can_be_changed(
    client: TestClient, make_user
) -> None:
    fan = await make_user("fan")
    assert (await client.get("/auth/me", fan.access)).json()["identity_mode"] == "named"
    resp = await client.put("/me/identity-mode", fan.access, json={"mode": "anonymous"})
    assert resp.status_code == 200 and resp.json()["identity_mode"] == "anonymous"
    assert (
        await client.put("/me/identity-mode", fan.access, json={"mode": "x"})
    ).status_code == 422
    assert (await client.put("/me/identity-mode", json={"mode": "named"})).status_code == 401


async def test_anonymous_messages_carry_no_identity_on_the_wire_or_in_history(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    await client.put("/me/identity-mode", fan.access, json={"mode": "anonymous"})
    sender = await _join(ws_url, fan, cid)
    listener = await _join(ws_url, owner, cid)

    await _say(sender, cid, "psst")
    raw = await _recv(listener, "chat_message")
    assert raw["data"]["author"] == {
        "id": None,
        "username": None,
        "display_name": "Anonymous",
        "avatar_url": None,
        "badges": [],
    }
    assert fan.id not in json.dumps(raw) and "fan" not in json.dumps(raw["data"]["author"])

    history = (await client.get(f"/communities/{cid}/messages")).json()
    assert history[0]["author"]["id"] is None and fan.id not in json.dumps(history)
    await sender.close()
    await listener.close()


async def test_switching_mode_does_not_rewrite_earlier_messages(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    sender = await _join(ws_url, fan, cid)
    await _say(sender, cid, "as me")
    await _recv(sender, "chat_message")
    await client.put("/me/identity-mode", fan.access, json={"mode": "anonymous"})
    await _say(sender, cid, "as nobody")
    await _recv(sender, "chat_message", content="as nobody")
    by_text = {
        m["content"]: m["author"]["username"]
        for m in (await client.get(f"/communities/{cid}/messages")).json()
    }
    assert by_text == {"as me": "fan", "as nobody": None}
    await sender.close()


async def test_badges_come_from_the_channel_roles(client: TestClient, make_user) -> None:
    owner, mod, fan = await make_user("owner"), await make_user("modder"), await make_user("fan")
    cid = await _channel(client, owner)
    for u in (mod, fan):
        await client.post(f"/communities/{cid}/follow", u.access)
    await client.post(f"/communities/{cid}/moderators", owner.access, json={"user_id": mod.id})
    from core.database import async_session_factory
    from models.message import Message

    async with async_session_factory() as db:
        for u in (owner, mod, fan):
            db.add(
                Message(community_id=uuid.UUID(cid), user_id=uuid.UUID(u.id), content=u.username)
            )
        await db.commit()
    badges = {
        m["content"]: m["author"]["badges"]
        for m in (await client.get(f"/communities/{cid}/messages")).json()
    }
    assert badges == {"owner": ["owner"], "modder": ["moderator", "follower"], "fan": ["follower"]}


# ── reveal ────────────────────────────────────────────────────────────
async def _anon_message(client: TestClient, make_user, ws_url: str):
    owner, mod, fan, other = (
        await make_user("owner"),
        await make_user("modder"),
        await make_user("fan"),
        await make_user("other"),
    )
    cid = await _channel(client, owner)
    await client.post(f"/communities/{cid}/follow", mod.access)
    await client.post(f"/communities/{cid}/moderators", owner.access, json={"user_id": mod.id})
    await client.put("/me/identity-mode", fan.access, json={"mode": "anonymous"})
    ws = await _join(ws_url, fan, cid)
    await _say(ws, cid, "secret")
    mid = (await _recv(ws, "chat_message"))["data"]["id"]
    await ws.close()
    return cid, mid, owner, mod, fan, other


async def test_moderators_can_reveal_an_author_and_it_is_audited(
    client: TestClient, make_user, ws_url: str
) -> None:
    cid, mid, owner, mod, fan, _ = await _anon_message(client, make_user, ws_url)
    for who in (owner, mod):
        resp = await client.get(f"/chat/messages/{mid}/author", who.access)
        assert resp.status_code == 200 and resp.json()["username"] == "fan"

    from core.database import async_session_factory
    from models.mod_action import ModAction

    async with async_session_factory() as db:
        rows = (
            (await db.execute(select(ModAction).where(ModAction.action == "reveal")))
            .scalars()
            .all()
        )
    assert {str(r.actor_id) for r in rows} == {owner.id, mod.id}
    assert all(str(r.target_user_id) == fan.id and str(r.community_id) == cid for r in rows)


async def test_outsiders_cannot_reveal_an_author(
    client: TestClient, make_user, ws_url: str
) -> None:
    _, mid, _, _, fan, other = await _anon_message(client, make_user, ws_url)
    assert (await client.get(f"/chat/messages/{mid}/author", other.access)).status_code == 403
    assert (await client.get(f"/chat/messages/{mid}/author", fan.access)).status_code == 403
    assert (await client.get(f"/chat/messages/{mid}/author")).status_code == 401
    assert (
        await client.get(f"/chat/messages/{uuid.uuid4()}/author", other.access)
    ).status_code == 404
