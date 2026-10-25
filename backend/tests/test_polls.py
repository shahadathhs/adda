"""F12: polls — one open at a time, one vote per account, live tallies, closing."""

import json
from datetime import UTC, datetime, timedelta

from sqlalchemy import update
from websockets.asyncio.client import ClientConnection

from tests.conftest import Account, TestClient
from tests.test_gateway_chat import _join, _recv


async def _channel(client: TestClient, owner: Account) -> str:
    resp = await client.post("/communities", owner.access, json={"name": "P", "slug": "polls"})
    return resp.json()["id"]


def _poll(question: str = "What next?", options=("Hum", "Lamp", "Cord"), seconds: int = 120):
    return {"question": question, "options": list(options), "duration_seconds": seconds}


async def _vote_ws(ws: ClientConnection, cid: str, poll_id: str, option_id: str) -> None:
    await ws.send(
        json.dumps(
            {
                "type": "vote",
                "channel": f"community/{cid}/chat",
                "data": {"poll_id": poll_id, "option_id": option_id},
            }
        )
    )


async def test_the_owner_starts_a_poll_and_the_room_is_told(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    ws = await _join(ws_url, fan, cid)
    resp = await client.post(f"/communities/{cid}/polls", owner.access, json=_poll())
    assert resp.status_code == 201
    started = (await _recv(ws, "poll_started"))["data"]
    assert started["question"] == "What next?" and started["status"] == "open"
    assert [o["label"] for o in started["options"]] == ["Hum", "Lamp", "Cord"]
    assert started["total"] == 0
    state = (await client.get(f"/communities/{cid}/chat-state")).json()
    assert state["poll"]["id"] == started["id"]
    await ws.close()


async def test_poll_rules_are_enforced(client: TestClient, make_user) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    url = f"/communities/{cid}/polls"
    assert (await client.post(url, fan.access, json=_poll())).status_code == 403
    assert (await client.post(url, json=_poll())).status_code == 401
    assert (await client.post(url, owner.access, json=_poll(options=("one",)))).status_code == 422
    assert (
        await client.post(url, owner.access, json=_poll(options=("a", "b", "c", "d", "e")))
    ).status_code == 422
    assert (await client.post(url, owner.access, json=_poll(seconds=5))).status_code == 400
    assert (await client.post(url, owner.access, json=_poll(question=" "))).status_code == 400
    assert (await client.post(url, owner.access, json=_poll())).status_code == 201
    assert (await client.post(url, owner.access, json=_poll())).status_code == 409  # one open


async def test_each_account_votes_once_and_tallies_update(
    client: TestClient, make_user, ws_url: str
) -> None:
    owner, a, b = await make_user("owner"), await make_user("voter1"), await make_user("voter2")
    cid = await _channel(client, owner)
    started = (await client.post(f"/communities/{cid}/polls", owner.access, json=_poll())).json()
    first, second = started["options"][0]["id"], started["options"][1]["id"]
    ws_a, ws_b = await _join(ws_url, a, cid), await _join(ws_url, b, cid)

    await _vote_ws(ws_a, cid, started["id"], first)
    mine = (await _recv(ws_a, "poll_update"))["data"]
    assert mine["my_vote"] == first and mine["total"] == 1
    await _vote_ws(ws_a, cid, started["id"], second)
    assert (await _recv(ws_a, "error"))["data"]["code"] == "already_voted"

    assert (
        await client.post(f"/polls/{started['id']}/vote", b.access, json={"option_id": first})
    ).status_code == 204
    live = (await _recv(ws_b, "poll_update"))["data"]
    assert (
        live["total"] == 2
        and live["options"][0]["votes"] == 2
        and live["options"][0]["percent"] == 100
    )
    assert live["my_vote"] is None or live["my_vote"] == first  # only the voter sees their own pick
    await ws_a.close()
    await ws_b.close()


async def test_guests_cannot_vote_and_a_bad_option_is_refused(
    client: TestClient, make_user, ws_url: str
) -> None:
    from websockets.asyncio.client import connect

    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    started = (await client.post(f"/communities/{cid}/polls", owner.access, json=_poll())).json()
    guest = await connect(f"{ws_url}/ws")
    await _vote_ws(guest, cid, started["id"], started["options"][0]["id"])
    assert (await _recv(guest, "error"))["data"]["code"] == "auth_required"
    assert (
        await client.post(
            f"/polls/{started['id']}/vote", json={"option_id": started["options"][0]["id"]}
        )
    ).status_code == 401
    bad = await client.post(
        f"/polls/{started['id']}/vote",
        fan.access,
        json={"option_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert bad.status_code == 400
    await guest.close()


async def test_ending_a_poll_keeps_the_result(client: TestClient, make_user, ws_url: str) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    started = (await client.post(f"/communities/{cid}/polls", owner.access, json=_poll())).json()
    option = started["options"][2]["id"]
    ws = await _join(ws_url, fan, cid)
    await client.post(f"/polls/{started['id']}/vote", fan.access, json={"option_id": option})

    assert (await client.post(f"/polls/{started['id']}/end", fan.access)).status_code == 403
    assert (await client.post(f"/polls/{started['id']}/end", owner.access)).status_code == 204
    closed = (await _recv(ws, "poll_closed"))["data"]
    assert closed["status"] == "closed" and closed["total"] == 1
    assert closed["options"][2]["votes"] == 1

    state = (await client.get(f"/communities/{cid}/chat-state", fan.access)).json()["poll"]
    assert state["status"] == "closed" and state["my_vote"] == option
    late = await client.post(
        f"/polls/{started['id']}/vote", owner.access, json={"option_id": option}
    )
    assert late.status_code == 400 and late.json()["code"] == "poll_closed"
    # A new poll can start once the last one is closed.
    assert (
        await client.post(f"/communities/{cid}/polls", owner.access, json=_poll())
    ).status_code == 201
    await ws.close()


async def test_a_poll_closes_itself_when_time_is_up(client: TestClient, make_user) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    started = (await client.post(f"/communities/{cid}/polls", owner.access, json=_poll())).json()
    await client.post(
        f"/polls/{started['id']}/vote", fan.access, json={"option_id": started["options"][0]["id"]}
    )

    from core.database import async_session_factory
    from models.poll import Poll

    async with async_session_factory() as db:
        await db.execute(update(Poll).values(closes_at=datetime.now(UTC) - timedelta(seconds=1)))
        await db.commit()

    state = (await client.get(f"/communities/{cid}/chat-state")).json()["poll"]
    assert state["status"] == "closed" and state["total"] == 1


async def test_tallies_survive_a_redis_restart(client: TestClient, make_user) -> None:
    owner, a, b = await make_user("owner"), await make_user("voter1"), await make_user("voter2")
    cid = await _channel(client, owner)
    started = (await client.post(f"/communities/{cid}/polls", owner.access, json=_poll())).json()
    option = started["options"][1]["id"]
    for who in (a, b):
        await client.post(f"/polls/{started['id']}/vote", who.access, json={"option_id": option})

    from core.redis_client import redis_client

    await redis_client.flushall()  # as if Redis restarted and lost the live tallies
    state = (await client.get(f"/communities/{cid}/chat-state")).json()["poll"]
    assert state["total"] == 2 and state["options"][1]["votes"] == 2
