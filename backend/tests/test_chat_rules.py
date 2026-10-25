"""F5, F10: replies, mentions, reactions, pins, slow mode, followers-only, rate limits, timeouts."""

import asyncio
import json
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from websockets.asyncio.client import ClientConnection

from tests.conftest import Account, TestClient
from tests.test_gateway_chat import _join, _recv


async def _channel(client: TestClient, owner: Account, slug: str = "rules") -> str:
    resp = await client.post("/communities", owner.access, json={"name": "R", "slug": slug})
    return resp.json()["id"]


async def _say(ws: ClientConnection, cid: str, content: str, reply_to: str | None = None) -> None:
    data = {"content": content, **({"reply_to": reply_to} if reply_to else {})}
    await ws.send(
        json.dumps({"type": "chat_message", "channel": f"community/{cid}/chat", "data": data})
    )


async def _send_ok(ws: ClientConnection, cid: str, content: str, reply_to: str | None = None):
    await _say(ws, cid, content, reply_to)
    return (await _recv(ws, "chat_message", content=content))["data"]


async def _error_code(ws: ClientConnection) -> str:
    return (await _recv(ws, "error"))["data"]["code"]


async def _mod(client: TestClient, owner: Account, cid: str, mod: Account) -> None:
    await client.post(f"/communities/{cid}/follow", mod.access)
    await client.post(f"/communities/{cid}/moderators", owner.access, json={"user_id": mod.id})


# ── replies ───────────────────────────────────────────────────────────
async def test_a_reply_carries_a_preview_and_a_deleted_parent_becomes_a_tombstone(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    ws = await _join(ws_url, fan, cid)
    parent = await _send_ok(ws, cid, "first")
    reply = await _send_ok(ws, cid, "second", parent["id"])
    assert reply["reply"]["content"] == "first" and reply["reply"]["author"]["username"] == "fan"

    await client.delete(f"/communities/{cid}/messages/{parent['id']}", fan.access)
    history = {m["content"]: m for m in (await client.get(f"/communities/{cid}/messages")).json()}
    assert "first" not in history
    assert history["second"]["reply"] == {
        "id": parent["id"],
        "deleted": True,
        "content": None,
        "author": None,
    }
    await ws.close()


async def test_deleting_a_message_tells_the_room(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    ws, watcher = await _join(ws_url, fan, cid), await _join(ws_url, owner, cid)
    sent = await _send_ok(ws, cid, "oops")
    await client.delete(f"/communities/{cid}/messages/{sent['id']}", owner.access)
    assert (await _recv(watcher, "message_deleted"))["data"]["message_id"] == sent["id"]
    await ws.close()
    await watcher.close()


# ── mentions ──────────────────────────────────────────────────────────
async def test_a_mention_notifies_only_that_account(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan, bystander = (
        await make_user("owner"),
        await make_user("fan"),
        await make_user("bystander"),
    )
    cid = await _channel(client, owner)
    ws = await _join(ws_url, fan, cid)
    sent = await _send_ok(ws, cid, "hello @owner and @ghost_user")
    assert sent["mentions"] == [owner.id]

    mine = (await client.get("/notifications", owner.access)).json()
    assert mine["unread"] == 1 and mine["items"][0]["kind"] == "mention"
    assert mine["items"][0]["payload"]["from"] == "Fan"
    assert (await client.get("/notifications", bystander.access)).json()["items"] == []
    assert (await client.get("/notifications", fan.access)).json()["items"] == []
    await ws.close()


async def test_an_anonymous_account_cannot_be_mentioned_by_name(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    await client.put("/me/identity-mode", owner.access, json={"mode": "anonymous"})
    ws = await _join(ws_url, fan, cid)
    sent = await _send_ok(ws, cid, "hi @owner")
    assert sent["mentions"] == []
    assert (await client.get("/notifications", owner.access)).json()["items"] == []
    await ws.close()


async def test_a_reply_notifies_the_author_of_the_parent_and_hides_an_anonymous_sender(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    owner_ws, fan_ws = await _join(ws_url, owner, cid), await _join(ws_url, fan, cid)
    parent = await _send_ok(owner_ws, cid, "question?")
    await client.put("/me/identity-mode", fan.access, json={"mode": "anonymous"})
    await _send_ok(fan_ws, cid, "answer", parent["id"])
    note = (await client.get("/notifications", owner.access)).json()["items"][0]
    assert note["kind"] == "reply" and note["payload"]["from"] == "Anonymous"
    assert "fan" not in json.dumps(note)
    await owner_ws.close()
    await fan_ws.close()


# ── reactions ─────────────────────────────────────────────────────────
async def test_reactions_toggle_and_arrive_as_a_batched_update(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    ws, watcher = await _join(ws_url, fan, cid), await _join(ws_url, owner, cid)
    sent = await _send_ok(ws, cid, "react to me")
    topic = f"community/{cid}/chat"

    async def react(socket, emoji: str, on: bool) -> None:
        await socket.send(
            json.dumps(
                {
                    "type": "react",
                    "channel": topic,
                    "data": {"message_id": sent["id"], "emoji": emoji, "on": on},
                }
            )
        )

    await react(ws, "👍", True)
    await react(watcher, "👍", True)
    update = (await _recv(watcher, "reaction_update"))["data"]
    assert update["message_id"] == sent["id"] and update["counts"]["👍"] in (1, 2)
    await asyncio.sleep(0.4)
    history = (await client.get(f"/communities/{cid}/messages")).json()
    assert history[0]["reactions"] == {"👍": 2}

    await react(ws, "👍", False)
    await asyncio.sleep(0.4)
    assert (await client.get(f"/communities/{cid}/messages")).json()[0]["reactions"] == {"👍": 1}
    mine = (await client.get(f"/communities/{cid}/messages", owner.access)).json()[0]
    assert mine["my_reactions"] == ["👍"]
    await ws.close()
    await watcher.close()


async def test_reactions_use_an_allowlist_and_a_per_message_cap(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    ws = await _join(ws_url, fan, cid)
    sent = await _send_ok(ws, cid, "cap me")
    topic = f"community/{cid}/chat"

    async def react(emoji: str) -> None:
        await ws.send(
            json.dumps(
                {
                    "type": "react",
                    "channel": topic,
                    "data": {"message_id": sent["id"], "emoji": emoji, "on": True},
                }
            )
        )

    await react("🦄")
    assert await _error_code(ws) == "bad_emoji"
    for emoji in ("👍", "❤️", "😂", "😮", "🎉"):
        await react(emoji)
    await asyncio.sleep(0.4)
    await react("👏")
    assert await _error_code(ws) == "too_many_reactions"
    await ws.close()


# ── pins ──────────────────────────────────────────────────────────────
async def test_moderators_pin_and_unpin_and_the_room_is_told(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, mod, fan = await make_user("owner"), await make_user("modder"), await make_user("fan")
    cid = await _channel(client, owner)
    await _mod(client, owner, cid, mod)
    ws, watcher = await _join(ws_url, fan, cid), await _join(ws_url, fan, cid)
    sent = await _send_ok(ws, cid, "pin this")

    assert (
        await client.post(f"/communities/{cid}/pin", fan.access, json={"message_id": sent["id"]})
    ).status_code == 403
    assert (
        await client.post(f"/communities/{cid}/pin", mod.access, json={"message_id": sent["id"]})
    ).status_code == 204
    pinned = (await _recv(watcher, "pin_update"))["data"]["message"]
    assert pinned["id"] == sent["id"]
    state = (await client.get(f"/communities/{cid}/chat-state")).json()
    assert state["pinned"]["content"] == "pin this"

    # Replacing is just pinning another; deleting the pinned message clears the pin.
    await client.delete(f"/communities/{cid}/messages/{sent['id']}", owner.access)
    cleared = (await _recv(watcher, "pin_update"))["data"]
    assert cleared["message"] is None
    assert (await client.get(f"/communities/{cid}/chat-state")).json()["pinned"] is None
    await ws.close()
    await watcher.close()


# ── settings: slow mode, followers-only ───────────────────────────────
async def test_slow_mode_limits_viewers_but_not_the_owner(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    resp = await client.put(
        f"/communities/{cid}/chat-settings", owner.access, json={"slow_mode_seconds": 30}
    )
    assert resp.status_code == 200 and resp.json()["slow_mode_seconds"] == 30
    assert (
        await client.put(
            f"/communities/{cid}/chat-settings", owner.access, json={"slow_mode_seconds": 7}
        )
    ).status_code == 400

    fan_ws, owner_ws = await _join(ws_url, fan, cid), await _join(ws_url, owner, cid)
    await _send_ok(fan_ws, cid, "one")
    await _say(fan_ws, cid, "two")
    assert await _error_code(fan_ws) == "slow_mode"
    await _send_ok(owner_ws, cid, "a")
    await _send_ok(owner_ws, cid, "b")
    await fan_ws.close()
    await owner_ws.close()


async def test_only_moderators_change_settings(client: TestClient, make_user) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    resp = await client.put(
        f"/communities/{cid}/chat-settings", fan.access, json={"followers_only": True}
    )
    assert resp.status_code == 403
    assert (
        await client.put(f"/communities/{cid}/chat-settings", json={"followers_only": True})
    ).status_code == 401


async def test_followers_only_chat_needs_a_follow(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    await client.put(
        f"/communities/{cid}/chat-settings", owner.access, json={"followers_only": True}
    )
    ws = await _join(ws_url, fan, cid)
    await _say(ws, cid, "let me in")
    assert await _error_code(ws) == "followers_only"
    await client.post(f"/communities/{cid}/follow", fan.access)
    await _send_ok(ws, cid, "now I follow")
    await ws.close()


# ── rate limit, duplicates ────────────────────────────────────────────
async def test_the_sixth_message_in_a_burst_is_rate_limited(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    ws = await _join(ws_url, fan, cid)
    for i in range(5):
        await _send_ok(ws, cid, f"message {i}")
    await _say(ws, cid, "message 5")
    assert await _error_code(ws) == "rate_limited"
    await ws.close()


async def test_an_identical_message_within_ten_seconds_is_dropped(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    ws = await _join(ws_url, fan, cid)
    await _send_ok(ws, cid, "same")
    await _say(ws, cid, "same")
    assert await _error_code(ws) == "duplicate"
    assert len((await client.get(f"/communities/{cid}/messages")).json()) == 1
    await ws.close()


# ── timeouts and bans ─────────────────────────────────────────────────
async def test_a_timeout_blocks_chat_and_expires(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    ws = await _join(ws_url, fan, cid)
    resp = await client.post(
        f"/communities/{cid}/bans", owner.access, json={"user_id": fan.id, "minutes": 10}
    )
    assert resp.status_code == 201 and resp.json()["expires_at"] is not None
    await _say(ws, cid, "hello?")
    assert await _error_code(ws) == "timed_out"

    from core.database import async_session_factory
    from models.channel_ban import ChannelBan

    async with async_session_factory() as db:
        await db.execute(update(ChannelBan).values(expires_at=datetime.now(UTC) - timedelta(1)))
        await db.commit()
    await _send_ok(ws, cid, "back again")
    await ws.close()


async def test_a_ban_is_permanent_until_lifted_and_the_user_is_told(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    ws = await _join(ws_url, fan, cid)
    own_events = await _join(ws_url, fan, cid)
    ban = (
        await client.post(
            f"/communities/{cid}/bans", owner.access, json={"user_id": fan.id, "reason": "spam"}
        )
    ).json()
    note = (await _recv(own_events, "moderation"))["data"]
    assert note["action"] == "ban" and note["expires_at"] is None
    await _say(ws, cid, "hi")
    assert await _error_code(ws) == "banned"

    listed = (await client.get(f"/communities/{cid}/bans", owner.access)).json()
    assert [b["username"] for b in listed] == ["fan"]
    assert (
        await client.delete(f"/communities/{cid}/bans/{ban['id']}", owner.access)
    ).status_code == 204
    assert (await _recv(own_events, "moderation"))["data"]["action"] == "lift"
    assert (await client.get(f"/communities/{cid}/bans", owner.access)).json() == []
    await _send_ok(ws, cid, "free")
    await ws.close()
    await own_events.close()


async def test_who_may_ban_whom(client: TestClient, make_user) -> None:
    owner, mod, other_mod, fan = (
        await make_user("owner"),
        await make_user("modder"),
        await make_user("modtwo"),
        await make_user("fan"),
    )
    cid = await _channel(client, owner)
    await _mod(client, owner, cid, mod)
    await _mod(client, owner, cid, other_mod)

    def ban(actor: Account, target: Account):
        return client.post(
            f"/communities/{cid}/bans", actor.access, json={"user_id": target.id, "minutes": 5}
        )

    assert (await ban(mod, fan)).status_code == 201
    assert (await ban(mod, other_mod)).status_code == 403  # only the owner bans a moderator
    assert (await ban(mod, owner)).status_code == 403
    assert (await ban(mod, mod)).status_code == 400
    assert (await ban(owner, other_mod)).status_code == 201
    assert (await ban(fan, mod)).status_code == 403


async def test_moderation_is_audited(client: TestClient, make_user, ws_url: str) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    ws = await _join(ws_url, fan, cid)
    sent = await _send_ok(ws, cid, "bad")
    await client.delete(f"/communities/{cid}/messages/{sent['id']}", owner.access)
    await client.post(
        f"/communities/{cid}/bans", owner.access, json={"user_id": fan.id, "minutes": 5}
    )
    await client.put(
        f"/communities/{cid}/chat-settings", owner.access, json={"followers_only": True}
    )

    actions = (await client.get(f"/communities/{cid}/mod-actions", owner.access)).json()
    assert {a["action"] for a in actions} >= {"delete", "timeout", "chat_settings"}
    assert all(a["actor"] == "owner" for a in actions)
    assert (await client.get(f"/communities/{cid}/mod-actions", fan.access)).status_code == 403

    from core.database import async_session_factory
    from models.mod_action import ModAction

    async with async_session_factory() as db:
        rows = (await db.execute(select(ModAction))).scalars().all()
    assert len(rows) >= 3
    await ws.close()


async def test_history_can_catch_up_after_a_message(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    ws = await _join(ws_url, fan, cid)
    first = await _send_ok(ws, cid, "one")
    await _send_ok(ws, cid, "two")
    await _send_ok(ws, cid, "three")
    caught_up = (await client.get(f"/communities/{cid}/messages?after={first['id']}")).json()
    assert [m["content"] for m in caught_up] == ["three", "two"]
    await ws.close()
