"""F5 — live chat over the real WebSocket gateway (persisted, fanned out through Redis)."""

import asyncio
import json
import uuid

import pytest
from websockets.asyncio.client import ClientConnection, connect

from tests.conftest import Account, TestClient


async def _channel(client: TestClient, owner: Account) -> str:
    resp = await client.post("/communities", owner.access, json={"name": "Ch", "slug": "ch-one"})
    return resp.json()["id"]


async def _recv(
    ws: ClientConnection, kind: str, timeout: float = 3.0, content: str | None = None
) -> dict:
    """Next message of the given type (and, for chat, content), skipping other chatter."""
    async with asyncio.timeout(timeout):
        while True:
            msg = json.loads(await ws.recv())
            if msg["type"] != kind:
                continue
            if content is not None and msg["data"].get("content") != content:
                continue
            return msg


async def _join(url: str, who: Account, cid: str) -> ClientConnection:
    ws = await connect(f"{url}/ws?token={who.access}")
    await ws.send(json.dumps({"type": "subscribe", "channel": f"community/{cid}/chat"}))
    await _recv(ws, "subscribed")
    return ws


async def test_chat_is_persisted_and_broadcast_with_the_database_id(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    sender = await _join(ws_url, fan, cid)
    listener = await _join(ws_url, owner, cid)

    await sender.send(
        json.dumps(
            {
                "type": "chat_message",
                "channel": f"community/{cid}/chat",
                "data": {"content": "hello"},
            }
        )
    )
    got = (await _recv(listener, "chat_message"))["data"]
    echoed = (await _recv(sender, "chat_message"))["data"]
    assert got["content"] == "hello" and got["author"]["username"] == "fan"
    assert got["id"] == echoed["id"]

    history = (await client.get(f"/communities/{cid}/messages")).json()
    assert [m["id"] for m in history] == [got["id"]]
    await sender.close()
    await listener.close()


async def test_messages_do_not_leak_to_other_channels(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, other, fan = await make_user("owner"), await make_user("other"), await make_user("fan")
    c1 = await _channel(client, owner)
    c2 = (
        await client.post("/communities", other.access, json={"name": "Two", "slug": "ch-two"})
    ).json()["id"]
    sender = await _join(ws_url, fan, c1)
    outsider = await _join(ws_url, other, c2)

    await sender.send(
        json.dumps(
            {
                "type": "chat_message",
                "channel": f"community/{c1}/chat",
                "data": {"content": "private to c1"},
            }
        )
    )
    await _recv(sender, "chat_message")
    with pytest.raises(TimeoutError):
        await _recv(outsider, "chat_message", timeout=0.5)
    await sender.close()
    await outsider.close()


async def test_invalid_messages_are_rejected_and_not_saved(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner = await make_user("owner")
    cid = await _channel(client, owner)
    ws = await _join(ws_url, owner, cid)
    topic = f"community/{cid}/chat"

    for content, code in (("x" * 301, "too_long"), ("   ", "empty"), ("\x00\x01", "empty")):
        await ws.send(
            json.dumps({"type": "chat_message", "channel": topic, "data": {"content": content}})
        )
        assert (await _recv(ws, "error"))["data"]["code"] == code, repr(content)
    assert (await client.get(f"/communities/{cid}/messages")).json() == []
    await ws.close()


async def test_a_message_of_exactly_300_characters_is_accepted(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner = await make_user("owner")
    cid = await _channel(client, owner)
    ws = await _join(ws_url, owner, cid)
    await ws.send(
        json.dumps(
            {
                "type": "chat_message",
                "channel": f"community/{cid}/chat",
                "data": {"content": "y" * 300},
            }
        )
    )
    assert len((await _recv(ws, "chat_message"))["data"]["content"]) == 300
    await ws.close()


async def test_unknown_channels_and_topics_are_reported(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner = await make_user("owner")
    ws = await connect(f"{ws_url}/ws?token={owner.access}")
    await ws.send(
        json.dumps(
            {
                "type": "chat_message",
                "channel": f"community/{uuid.uuid4()}/chat",
                "data": {"content": "hi"},
            }
        )
    )
    assert (await _recv(ws, "error"))["data"]["code"] == "not_found"
    await ws.send(
        json.dumps({"type": "chat_message", "channel": "not-a-topic", "data": {"content": "hi"}})
    )
    assert (await _recv(ws, "error"))["data"]["code"] == "invalid_channel"
    await ws.close()


async def test_a_reply_to_a_message_in_another_channel_is_not_linked(
    client: TestClient, make_user, ws_url: str
) -> None:
    a, b = await make_user("alpha"), await make_user("bravo")
    ca = await _channel(client, a)
    cb = (await client.post("/communities", b.access, json={"name": "B", "slug": "ch-b"})).json()[
        "id"
    ]
    wa, wb = await _join(ws_url, a, ca), await _join(ws_url, b, cb)

    await wa.send(
        json.dumps(
            {"type": "chat_message", "channel": f"community/{ca}/chat", "data": {"content": "in a"}}
        )
    )
    parent = (await _recv(wa, "chat_message"))["data"]["id"]
    await wb.send(
        json.dumps(
            {
                "type": "chat_message",
                "channel": f"community/{cb}/chat",
                "data": {"content": "reply?", "reply_to": parent},
            }
        )
    )
    assert (await _recv(wb, "chat_message"))["data"]["reply_to"] is None
    await wa.close()
    await wb.close()


async def test_replies_in_the_same_channel_are_linked(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    wo, wf = await _join(ws_url, owner, cid), await _join(ws_url, fan, cid)
    topic = f"community/{cid}/chat"

    await wo.send(
        json.dumps({"type": "chat_message", "channel": topic, "data": {"content": "question"}})
    )
    parent = (await _recv(wo, "chat_message"))["data"]["id"]
    await wf.send(
        json.dumps(
            {
                "type": "chat_message",
                "channel": topic,
                "data": {"content": "answer", "reply_to": parent},
            }
        )
    )
    assert (await _recv(wf, "chat_message", content="answer"))["data"]["reply_to"] == parent
    history = (await client.get(f"/communities/{cid}/messages")).json()
    assert history[0]["reply_to"] == parent
    await wo.close()
    await wf.close()
