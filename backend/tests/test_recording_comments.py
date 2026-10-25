"""F16: comments at a position in a recording; owner can delete recordings."""

import os

from tests.conftest import Account, TestClient
from tests.test_chat_rules import _mod


async def _channel_with_recording(client: TestClient, owner: Account) -> tuple[str, str]:
    from core.config import settings

    cid = (
        await client.post("/communities", owner.access, json={"name": "Rec", "slug": "rec"})
    ).json()["id"]
    folder = os.path.join(settings.recordings_dir, "community", cid)
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, "show.mp4"), "wb") as f:
        f.write(b"x")
    path = (await client.get(f"/recordings?community_id={cid}")).json()[0]["path"]
    return cid, path


def _body(cid: str, path: str, at: float, text: str = "nice") -> dict:
    return {"community_id": cid, "path": path, "at_seconds": at, "body": text}


async def test_comments_are_sorted_by_time_or_recency_and_readable_by_guests(
    client: TestClient, make_user
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid, path = await _channel_with_recording(client, owner)
    for at, text in ((5, "early in time"), (90, "later in time")):  # posted in this order
        await client.post("/recordings/comments", fan.access, json=_body(cid, path, at, text))

    url = f"/recordings/comments?community_id={cid}&path={path}"
    by_time = (await client.get(url)).json()  # no token: guests can read
    assert [c["body"] for c in by_time] == ["early in time", "later in time"]
    recent = (await client.get(f"{url}&sort=recent")).json()
    assert [c["body"] for c in recent] == ["later in time", "early in time"]


async def test_guests_cannot_comment_and_input_is_validated(client: TestClient, make_user) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid, path = await _channel_with_recording(client, owner)
    assert (await client.post("/recordings/comments", json=_body(cid, path, 1))).status_code == 401
    assert (
        await client.post("/recordings/comments", fan.access, json=_body(cid, path, -1))
    ).status_code == 422
    assert (
        await client.post("/recordings/comments", fan.access, json=_body(cid, path, 1, "x" * 301))
    ).status_code == 422
    nowhere = _body(cid, "community/nope/missing.mp4", 1)
    assert (await client.post("/recordings/comments", fan.access, json=nowhere)).status_code == 404


async def test_anonymous_comments_hide_the_author(client: TestClient, make_user) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid, path = await _channel_with_recording(client, owner)
    await client.put("/me/identity-mode", fan.access, json={"mode": "anonymous"})
    made = (await client.post("/recordings/comments", fan.access, json=_body(cid, path, 3))).json()
    assert made["author"]["id"] is None and made["author"]["display_name"] == "Anonymous"
    listed = (await client.get(f"/recordings/comments?community_id={cid}&path={path}")).json()
    assert fan.id not in str(listed) and "fan" not in str(listed[0]["author"])


async def test_authors_and_moderators_delete_comments(client: TestClient, make_user) -> None:
    owner, mod, fan, other = (
        await make_user("owner"),
        await make_user("modder"),
        await make_user("fan"),
        await make_user("other"),
    )
    cid, path = await _channel_with_recording(client, owner)
    await _mod(client, owner, cid, mod)

    async def make() -> str:
        return (
            await client.post("/recordings/comments", fan.access, json=_body(cid, path, 1))
        ).json()["id"]

    assert (
        await client.delete(f"/recordings/comments/{await make()}", other.access)
    ).status_code == 403
    assert (
        await client.delete(f"/recordings/comments/{await make()}", fan.access)
    ).status_code == 204
    assert (
        await client.delete(f"/recordings/comments/{await make()}", mod.access)
    ).status_code == 204
    assert (
        await client.delete(f"/recordings/comments/{await make()}", owner.access)
    ).status_code == 204
    remaining = (await client.get(f"/recordings/comments?community_id={cid}&path={path}")).json()
    assert len(remaining) == 1


async def test_the_owner_deletes_a_recording_and_others_cannot(
    client: TestClient, make_user
) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid, path = await _channel_with_recording(client, owner)
    url = f"/recordings/file?community_id={cid}&path={path}"
    assert (await client.delete(url, fan.access)).status_code == 403
    assert (await client.delete(url)).status_code == 401
    assert (await client.delete(url, owner.access)).status_code == 204
    assert (await client.get(f"/recordings?community_id={cid}")).json() == []
    assert (await client.delete(url, owner.access)).status_code == 404
