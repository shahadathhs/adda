"""F3 — channel lifecycle: create, stream key, rotate, edit, delete, follow."""

import uuid

from tests.conftest import Account, TestClient


async def _create(client: TestClient, owner: Account, slug: str = "nila-workshop") -> dict:
    resp = await client.post(
        "/communities", owner.access, json={"name": "Nila Workshop", "slug": slug}
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


async def test_create_requires_an_account(client: TestClient) -> None:
    resp = await client.post("/communities", json={"name": "X", "slug": "x-channel"})
    assert resp.status_code == 401


async def test_create_channel_and_look_it_up_by_slug(client: TestClient, make_user) -> None:
    owner = await make_user("nila")
    created = await _create(client, owner)
    assert created["slug"] == "nila-workshop"
    assert created["owner_id"] == owner.id
    assert created["is_live"] is False

    by_slug = await client.get("/communities/by-slug/nila-workshop")
    assert by_slug.status_code == 200
    assert by_slug.json()["id"] == created["id"]
    assert (await client.get("/communities/by-slug/missing-channel")).status_code == 404


async def test_duplicate_slug_is_a_conflict(client: TestClient, make_user) -> None:
    await _create(client, await make_user("nila"))
    resp = await client.post(
        "/communities",
        (await make_user("sam")).access,
        json={"name": "Other", "slug": "nila-workshop"},
    )
    assert resp.status_code == 409


async def test_slug_rules_are_enforced(client: TestClient, make_user) -> None:
    owner = await make_user("nila")
    resp = await client.post(
        "/communities", owner.access, json={"name": "Bad", "slug": "Not A Slug!"}
    )
    assert resp.status_code == 422


async def test_only_the_owner_sees_the_stream_key(client: TestClient, make_user) -> None:
    owner, other = await make_user("nila"), await make_user("sam")
    channel = await _create(client, owner)

    mine = await client.get(f"/communities/{channel['id']}/stream-key", owner.access)
    assert mine.status_code == 200
    body = mine.json()
    assert body["stream_key"].startswith("sk_")
    assert f"community/{channel['id']}?key={body['stream_key']}" in body["stream_url"]

    assert (
        await client.get(f"/communities/{channel['id']}/stream-key", other.access)
    ).status_code == 403
    assert (await client.get(f"/communities/{channel['id']}/stream-key")).status_code == 401
    # The public channel payload never leaks the key.
    public = await client.get(f"/communities/{channel['id']}")
    assert body["stream_key"] not in public.text


async def test_rotating_the_key_changes_it_and_kicks_the_publisher(
    client: TestClient, make_user, mediamtx: list[str]
) -> None:
    owner = await make_user("nila")
    channel = await _create(client, owner)
    old = (await client.get(f"/communities/{channel['id']}/stream-key", owner.access)).json()

    rotated = await client.post(f"/communities/{channel['id']}/stream-key/rotate", owner.access)
    assert rotated.status_code == 200
    assert rotated.json()["stream_key"] != old["stream_key"]
    assert mediamtx == [channel["id"]]


async def test_only_the_owner_can_rotate(
    client: TestClient, make_user, mediamtx: list[str]
) -> None:
    owner, other = await make_user("nila"), await make_user("sam")
    channel = await _create(client, owner)
    resp = await client.post(f"/communities/{channel['id']}/stream-key/rotate", other.access)
    assert resp.status_code == 403
    assert mediamtx == []


async def test_owner_can_edit_others_cannot(client: TestClient, make_user) -> None:
    owner, other = await make_user("nila"), await make_user("sam")
    channel = await _create(client, owner)

    ok = await client.patch(
        f"/communities/{channel['id']}", owner.access, json={"description": "Slow repairs."}
    )
    assert ok.status_code == 200
    assert ok.json()["description"] == "Slow repairs."

    denied = await client.patch(
        f"/communities/{channel['id']}", other.access, json={"description": "hijack"}
    )
    assert denied.status_code == 403


async def test_owner_can_delete_and_it_is_gone(client: TestClient, make_user) -> None:
    owner, other = await make_user("nila"), await make_user("sam")
    channel = await _create(client, owner)

    assert (await client.delete(f"/communities/{channel['id']}", other.access)).status_code == 403
    assert (await client.delete(f"/communities/{channel['id']}", owner.access)).status_code == 204
    assert (await client.get(f"/communities/{channel['id']}")).status_code == 404


async def test_unknown_channel_is_a_404(client: TestClient) -> None:
    assert (await client.get(f"/communities/{uuid.uuid4()}")).status_code == 404


async def test_my_channels_lists_only_mine(client: TestClient, make_user) -> None:
    nila, sam = await make_user("nila"), await make_user("sam")
    await _create(client, nila, "nila-workshop")
    await _create(client, sam, "sam-chess")
    mine = await client.get("/communities/mine", nila.access)
    assert [c["slug"] for c in mine.json()] == ["nila-workshop"]


# ── follows (F6) ──────────────────────────────────────────────────────
async def test_follow_and_unfollow_are_idempotent(client: TestClient, make_user) -> None:
    owner, fan = await make_user("nila"), await make_user("fan")
    cid = (await _create(client, owner))["id"]

    first = await client.post(f"/communities/{cid}/follow", fan.access)
    again = await client.post(f"/communities/{cid}/follow", fan.access)
    assert first.status_code == again.status_code == 201
    assert first.json()["follower_count"] == again.json()["follower_count"] == 1

    assert (await client.get(f"/communities/{cid}/follow", fan.access)).json() == {
        "following": True
    }
    assert (await client.delete(f"/communities/{cid}/follow", fan.access)).status_code == 204
    assert (await client.delete(f"/communities/{cid}/follow", fan.access)).status_code == 204
    assert (await client.get(f"/communities/{cid}/follow", fan.access)).json() == {
        "following": False
    }


async def test_follow_needs_an_account_and_a_real_channel(client: TestClient, make_user) -> None:
    owner, fan = await make_user("nila"), await make_user("fan")
    cid = (await _create(client, owner))["id"]
    assert (await client.post(f"/communities/{cid}/follow")).status_code == 401
    assert (await client.post(f"/communities/{uuid.uuid4()}/follow", fan.access)).status_code == 404


async def test_follower_count_and_followed_by_me(client: TestClient, make_user) -> None:
    owner = await make_user("nila")
    fans = [await make_user(f"fan{i}") for i in range(3)]
    cid = (await _create(client, owner))["id"]
    for fan in fans:
        await client.post(f"/communities/{cid}/follow", fan.access)

    assert (await client.get(f"/communities/{cid}")).json()["follower_count"] == 3
    followers = await client.get(f"/communities/{cid}/followers")
    assert {f["username"] for f in followers.json()} == {"fan0", "fan1", "fan2"}
    followed = await client.get("/communities/followed/by-me", fans[0].access)
    assert [c["id"] for c in followed.json()] == [cid]
