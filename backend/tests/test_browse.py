"""Browse and global search: paginated, filtered, public-only."""

from pathlib import Path

from core.config import settings
from tests.conftest import Account, TestClient


async def _channel(client: TestClient, owner: Account, name: str, **extra) -> dict:
    slug = name.lower().replace(" ", "-")
    resp = await client.post(
        "/communities", owner.access, json={"name": name, "slug": slug, **extra}
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def _recording(community_id: str, name: str, size: int = 10) -> None:
    folder = Path(settings.recordings_dir) / "community" / community_id
    folder.mkdir(parents=True, exist_ok=True)
    (folder / name).write_bytes(b"0" * size)


async def test_channels_are_paginated_and_sorted(client: TestClient, make_user) -> None:
    owner = await make_user("owner")
    for n in ("Radio Bench", "Chess Night", "Soldering Hour", "Tape Deck", "Audio Lab"):
        await _channel(client, owner, n)

    first = (await client.get("/browse/channels?page_size=2&sort=name")).json()
    assert first["total"] == 5 and first["page"] == 1 and first["page_size"] == 2
    assert [i["name"] for i in first["items"]] == ["Audio Lab", "Chess Night"]
    last = (await client.get("/browse/channels?page_size=2&page=3&sort=name")).json()
    assert [i["name"] for i in last["items"]] == ["Tape Deck"]
    beyond = (await client.get("/browse/channels?page_size=2&page=9")).json()
    assert beyond["items"] == [] and beyond["total"] == 5

    found = (await client.get("/browse/channels?q=chess")).json()
    assert [i["name"] for i in found["items"]] == ["Chess Night"]
    # Offline channels only (nobody is streaming in tests); the live filter is empty.
    assert (await client.get("/browse/channels?status=offline")).json()["total"] == 5
    assert (await client.get("/browse/channels?status=live")).json()["total"] == 0


async def test_browse_rejects_bad_parameters(client: TestClient) -> None:
    for query in ("page=0", "page_size=500", "sort=random", "status=maybe"):
        assert (await client.get(f"/browse/channels?{query}")).status_code == 422
    assert (await client.get("/search")).status_code == 422
    assert (await client.get("/search?q=")).status_code == 422


async def test_private_channels_are_not_listed(client: TestClient, make_user) -> None:
    owner = await make_user("owner")
    await _channel(client, owner, "Open Room")
    secret = await _channel(client, owner, "Secret Room", is_private=True)
    _recording(secret["id"], "hidden.mp4")

    names = [i["name"] for i in (await client.get("/browse/channels")).json()["items"]]
    assert names == ["Open Room"]
    assert (await client.get("/browse/recordings")).json()["total"] == 0
    hits = (await client.get("/search?q=room")).json()
    assert [c["name"] for c in hits["channels"]] == ["Open Room"] and hits["recordings"] == []


async def test_recordings_filter_sort_and_paginate(client: TestClient, make_user) -> None:
    owner = await make_user("owner")
    a = await _channel(client, owner, "Alpha")
    b = await _channel(client, owner, "Beta")
    _recording(a["id"], "one.mp4", 10)
    _recording(a["id"], "two.mp4", 300)
    _recording(b["id"], "three.mp4", 50)

    everything = (await client.get("/browse/recordings?sort=largest")).json()
    assert everything["total"] == 3
    assert [i["name"] for i in everything["items"]] == ["two.mp4", "three.mp4", "one.mp4"]
    only_a = (await client.get("/browse/recordings?channel=alpha")).json()
    assert only_a["total"] == 2
    by_name = (await client.get("/browse/recordings?q=thr")).json()
    assert [i["name"] for i in by_name["items"]] == ["three.mp4"]
    by_channel_name = (await client.get("/browse/recordings?q=beta")).json()
    assert by_channel_name["total"] == 1
    paged = (await client.get("/browse/recordings?page_size=2&page=2&sort=largest")).json()
    assert [i["name"] for i in paged["items"]] == ["one.mp4"]


async def test_global_search_groups_channels_and_recordings(client: TestClient, make_user) -> None:
    owner = await make_user("owner")
    radio = await _channel(client, owner, "Radio Bench", description="Old radios")
    await _channel(client, owner, "Chess Night")
    _recording(radio["id"], "radio-build.mp4")

    out = (await client.get("/search?q=radio&limit=3")).json()
    assert out["query"] == "radio"
    assert [c["name"] for c in out["channels"]] == ["Radio Bench"]
    assert [r["name"] for r in out["recordings"]] == ["radio-build.mp4"]
    # The about text is searched too.
    assert (await client.get("/search?q=old+radios")).json()["channels"][0]["name"] == "Radio Bench"
    none = (await client.get("/search?q=zzzz")).json()
    assert none["channels"] == [] and none["recordings"] == []
