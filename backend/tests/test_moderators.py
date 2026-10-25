"""F5/F15 — channel roles: the owner makes followers moderators."""

import uuid

from tests.conftest import Account, TestClient


async def _channel(client: TestClient, owner: Account) -> str:
    resp = await client.post("/communities", owner.access, json={"name": "Ch", "slug": "ch-one"})
    return resp.json()["id"]


async def _follow(client: TestClient, cid: str, who: Account) -> None:
    assert (await client.post(f"/communities/{cid}/follow", who.access)).status_code == 201


async def test_owner_makes_a_follower_a_moderator(client: TestClient, make_user) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    await _follow(client, cid, fan)

    resp = await client.post(
        f"/communities/{cid}/moderators", owner.access, json={"user_id": fan.id}
    )
    assert resp.status_code == 201
    assert resp.json()["username"] == "fan"

    listed = await client.get(f"/communities/{cid}/moderators")
    assert [m["username"] for m in listed.json()] == ["fan"]


async def test_making_a_moderator_is_idempotent(client: TestClient, make_user) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    await _follow(client, cid, fan)
    for _ in range(2):
        resp = await client.post(
            f"/communities/{cid}/moderators", owner.access, json={"user_id": fan.id}
        )
        assert resp.status_code == 201
    assert len((await client.get(f"/communities/{cid}/moderators")).json()) == 1


async def test_only_followers_can_be_made_moderators(client: TestClient, make_user) -> None:
    owner, stranger = await make_user("owner"), await make_user("stranger")
    cid = await _channel(client, owner)
    resp = await client.post(
        f"/communities/{cid}/moderators", owner.access, json={"user_id": stranger.id}
    )
    assert resp.status_code == 400


async def test_the_owner_cannot_be_made_a_moderator(client: TestClient, make_user) -> None:
    owner = await make_user("owner")
    cid = await _channel(client, owner)
    resp = await client.post(
        f"/communities/{cid}/moderators", owner.access, json={"user_id": owner.id}
    )
    assert resp.status_code == 400


async def test_only_the_owner_manages_moderators(client: TestClient, make_user) -> None:
    owner, fan, other = await make_user("owner"), await make_user("fan"), await make_user("other")
    cid = await _channel(client, owner)
    await _follow(client, cid, fan)

    assert (
        await client.post(f"/communities/{cid}/moderators", other.access, json={"user_id": fan.id})
    ).status_code == 403
    assert (
        await client.post(f"/communities/{cid}/moderators", json={"user_id": fan.id})
    ).status_code == 401

    await client.post(f"/communities/{cid}/moderators", owner.access, json={"user_id": fan.id})
    assert (
        await client.delete(f"/communities/{cid}/moderators/{fan.id}", other.access)
    ).status_code == 403
    assert (
        await client.delete(f"/communities/{cid}/moderators/{fan.id}", owner.access)
    ).status_code == 204
    assert (await client.get(f"/communities/{cid}/moderators")).json() == []


async def test_a_moderator_can_resign_and_removal_is_idempotent(
    client: TestClient, make_user
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    await _follow(client, cid, fan)
    await client.post(f"/communities/{cid}/moderators", owner.access, json={"user_id": fan.id})

    assert (
        await client.delete(f"/communities/{cid}/moderators/{fan.id}", fan.access)
    ).status_code == 204
    assert (
        await client.delete(f"/communities/{cid}/moderators/{fan.id}", fan.access)
    ).status_code == 204


async def test_unknown_channel_or_user(client: TestClient, make_user) -> None:
    owner = await make_user("owner")
    cid = await _channel(client, owner)
    assert (await client.get(f"/communities/{uuid.uuid4()}/moderators")).status_code == 404
    resp = await client.post(
        f"/communities/{cid}/moderators", owner.access, json={"user_id": str(uuid.uuid4())}
    )
    assert resp.status_code == 404


async def test_moderators_appear_in_my_channels_with_their_role(
    client: TestClient, make_user
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    await _follow(client, cid, fan)
    await client.post(f"/communities/{cid}/moderators", owner.access, json={"user_id": fan.id})

    mine_owner = (await client.get("/communities/mine", owner.access)).json()
    mine_mod = (await client.get("/communities/mine", fan.access)).json()
    assert [(c["id"], c["my_role"]) for c in mine_owner] == [(cid, "owner")]
    assert [(c["id"], c["my_role"]) for c in mine_mod] == [(cid, "moderator")]


async def test_moderators_may_see_stream_health_but_not_the_stream_key(
    client: TestClient, make_user
) -> None:
    owner, fan, other = await make_user("owner"), await make_user("fan"), await make_user("other")
    cid = await _channel(client, owner)
    await _follow(client, cid, fan)
    await client.post(f"/communities/{cid}/moderators", owner.access, json={"user_id": fan.id})

    assert (await client.get(f"/communities/{cid}/stream-key", fan.access)).status_code == 403
    assert (
        await client.get(f"/streaming/communities/{cid}/health", other.access)
    ).status_code == 403
    assert (await client.get(f"/streaming/communities/{cid}/health", fan.access)).status_code == 200
