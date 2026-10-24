"""F15: the channel page — links, banner, announcements, followers since, deleting a channel."""

import os

from tests.conftest import Account, TestClient
from tests.test_emotes import png


async def _channel(client: TestClient, owner: Account, slug: str = "page") -> str:
    resp = await client.post("/communities", owner.access, json={"name": "Page", "slug": slug})
    return resp.json()["id"]


async def test_links_are_saved_and_limited_to_http_urls(client: TestClient, make_user) -> None:
    owner = await make_user("owner")
    cid = await _channel(client, owner)
    good = [
        {"label": "Site", "url": "https://nila.example"},
        {"label": "Notes", "url": "http://a.b/c"},
    ]
    resp = await client.patch(f"/communities/{cid}", owner.access, json={"links": good})
    assert resp.status_code == 200 and resp.json()["links"] == good
    assert (await client.get(f"/communities/{cid}")).json()["links"] == good

    for bad in (
        [{"label": "x", "url": "javascript:alert(1)"}],
        [{"label": "x", "url": "ftp://files"}],
        [{"label": "", "url": "https://a.b"}],
        [{"label": "x", "url": "https://a.b"}] * 6,
    ):
        assert (
            await client.patch(f"/communities/{cid}", owner.access, json={"links": bad})
        ).status_code == 422
    cleared = await client.patch(f"/communities/{cid}", owner.access, json={"links": []})
    assert cleared.json()["links"] == []


async def test_announcements_pinned_first_and_owner_only(client: TestClient, make_user) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    url = f"/communities/{cid}/announcements"
    assert (await client.post(url, fan.access, json={"body": "hi"})).status_code == 403
    assert (await client.post(url, json={"body": "hi"})).status_code == 401
    assert (await client.post(url, owner.access, json={"body": ""})).status_code == 422
    first = await client.post(url, owner.access, json={"body": "older, pinned", "pinned": True})
    await client.post(url, owner.access, json={"body": "newest"})
    assert first.status_code == 201

    listed = (await client.get(url)).json()  # public
    assert [a["body"] for a in listed] == ["older, pinned", "newest"]
    assert (await client.delete(f"{url}/{first.json()['id']}", fan.access)).status_code == 403
    assert (await client.delete(f"{url}/{first.json()['id']}", owner.access)).status_code == 204
    assert [a["body"] for a in (await client.get(url)).json()] == ["newest"]


async def test_banner_upload_replace_and_remove(client: TestClient, make_user) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)

    def upload(who: Account, data: bytes):
        return client.post(
            f"/communities/{cid}/banner", who.access, files={"file": ("b.png", data, "image/png")}
        )

    assert (await upload(fan, png(40, 10))).status_code == 403
    assert (await upload(owner, b"not an image")).status_code == 400
    assert (await upload(owner, png(5000, 10))).status_code == 400
    assert (await upload(owner, png() + b"\x00" * (2 * 1024 * 1024))).status_code == 400

    first = (await upload(owner, png(40, 10))).json()["banner_url"]
    served = await client.get(first.removeprefix("/api"))
    assert served.status_code == 200 and served.headers["content-type"] == "image/png"

    second = (await upload(owner, png(50, 10))).json()["banner_url"]
    assert second != first
    assert (await client.get(first.removeprefix("/api"))).status_code == 404  # old file removed

    removed = await client.delete(f"/communities/{cid}/banner", owner.access)
    assert removed.json()["banner_url"] is None
    assert (await client.get(second.removeprefix("/api"))).status_code == 404


async def test_followers_show_since(client: TestClient, make_user) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    await client.post(f"/communities/{cid}/follow", fan.access)
    followers = (await client.get(f"/communities/{cid}/followers")).json()
    assert followers[0]["username"] == "fan" and followers[0]["since"]


async def test_deleting_a_channel_removes_its_recordings_and_emotes(
    client: TestClient, make_user
) -> None:
    from core.config import settings
    from tests.test_emotes import _upload

    owner = await make_user("owner")
    cid = await _channel(client, owner)
    folder = os.path.join(settings.recordings_dir, "community", cid)
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, "2026-10-24.mp4"), "wb") as f:
        f.write(b"x")
    emote_url = (
        (await _upload(client, owner, cid, "chai", png())).json()["url"].removeprefix("/api")
    )

    assert (await client.delete(f"/communities/{cid}", owner.access)).status_code == 204
    assert not os.path.exists(folder)
    assert (await client.get(emote_url)).status_code == 404
    assert (await client.get(f"/communities/{cid}")).status_code == 404
