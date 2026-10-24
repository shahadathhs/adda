"""Uploaded videos: resumable upload, ownership, preparation, visibility, playback, browse."""

import asyncio
from pathlib import Path

import pytest

from models.video import VideoStatus
from modules.videos.service import media, uploads
from modules.videos.service.storage import videos_root
from tests.conftest import Account, TestClient

GOOD = media.MediaInfo(
    duration=12.0,
    width=1280,
    height=720,
    video_codec="h264",
    audio_codec="aac",
    formats=frozenset({"mov", "mp4"}),
)


@pytest.fixture(autouse=True)
def fake_ffmpeg(monkeypatch):
    """No ffmpeg here: stand in for the probe, the remux and the poster."""
    state = {"info": GOOD}

    async def probe(path: Path) -> media.MediaInfo:
        return state["info"]

    async def finalize(part: Path, info: media.MediaInfo, folder: Path) -> str:
        name = "video.mp4" if info.formats & media.MP4_FAMILY else "video.webm"
        part.replace(folder / name)
        return name

    async def make_poster(video: Path, duration: float, out: Path) -> None:
        out.write_bytes(b"\xff\xd8\xff jpeg")

    monkeypatch.setattr(media, "probe", probe)
    monkeypatch.setattr(media, "finalize", finalize)
    monkeypatch.setattr(media, "make_poster", make_poster)
    return state


async def _channel(client: TestClient, owner: Account, slug: str = "vids") -> str:
    resp = await client.post("/communities", owner.access, json={"name": slug, "slug": slug})
    return resp.json()["id"]


async def _start(client: TestClient, owner: Account, cid: str, size: int, **extra) -> dict:
    body = {"title": "Build log", "filename": "build.mp4", "size_bytes": size, **extra}
    resp = await client.post(f"/communities/{cid}/videos", owner.access, json=body)
    assert resp.status_code == 201, resp.text
    return resp.json()["video"]


async def _send(client: TestClient, who: Account, vid: str, offset: int, data: bytes):
    return await client.put(
        f"/videos/{vid}/chunk?offset={offset}",
        who.access,
        content=data,
        headers={"content-type": "application/octet-stream"},
    )


async def _upload_ready(client: TestClient, owner: Account, cid: str, **extra) -> dict:
    data = b"v" * 1000
    video = await _start(client, owner, cid, len(data), **extra)
    assert (await _send(client, owner, video["id"], 0, data)).status_code == 200
    done = await client.post(f"/videos/{video['id']}/complete", owner.access)
    assert done.status_code == 200 and done.json()["status"] == "processing"
    for _ in range(50):
        got = (await client.get(f"/videos/{video['id']}", owner.access)).json()
        if got["status"] != "processing":
            return got
        await asyncio.sleep(0.05)
    raise AssertionError("never finished processing")


async def test_upload_in_parts_then_play(client: TestClient, make_user) -> None:
    owner = await make_user("owner")
    cid = await _channel(client, owner)
    data = bytes(range(256)) * 12  # 3072 bytes
    video = await _start(client, owner, cid, len(data))
    assert video["status"] == "uploading" and video["received_bytes"] == 0

    first = await _send(client, owner, video["id"], 0, data[:1000])
    assert first.json()["received_bytes"] == 1000
    # A part at the wrong offset is refused, and the video says where to resume.
    assert (await _send(client, owner, video["id"], 500, data[1000:2000])).status_code == 409
    assert (await client.get(f"/videos/{video['id']}", owner.access)).json()[
        "received_bytes"
    ] == 1000
    # Finishing early is refused.
    assert (await client.post(f"/videos/{video['id']}/complete", owner.access)).status_code == 400
    assert (await _send(client, owner, video["id"], 1000, data[1000:])).status_code == 200

    done = await client.post(f"/videos/{video['id']}/complete", owner.access)
    assert done.json()["status"] == "processing"
    for _ in range(50):
        got = (await client.get(f"/videos/{video['id']}", owner.access)).json()
        if got["status"] == "ready":
            break
        await asyncio.sleep(0.05)
    assert got["status"] == "ready"
    assert got["duration_seconds"] == 12.0 and got["width"] == 1280
    assert got["file_url"].endswith(f"/videos/{video['id']}/file")

    # Anyone can watch a public video; the file is served whole and by range.
    full = await client.get(got["file_url"].removeprefix("/api"))
    assert full.status_code == 200 and full.content == data
    assert full.headers["content-type"] == "video/mp4"
    ranged = await client.get(got["file_url"].removeprefix("/api"), headers={"range": "bytes=0-9"})
    assert ranged.status_code == 206 and ranged.content == data[:10]
    poster = await client.get(got["poster_url"].removeprefix("/api"))
    assert poster.status_code == 200 and poster.headers["content-type"] == "image/jpeg"
    # Nothing is left of the partial upload.
    assert not (videos_root() / video["id"] / "upload.part").exists()


async def test_only_the_owner_uploads_and_manages(client: TestClient, make_user) -> None:
    owner, other = await make_user("owner"), await make_user("other")
    cid = await _channel(client, owner)
    body = {"title": "x", "filename": "x.mp4", "size_bytes": 10}
    assert (
        await client.post(f"/communities/{cid}/videos", other.access, json=body)
    ).status_code == 403
    assert (await client.post(f"/communities/{cid}/videos", json=body)).status_code == 401

    video = await _upload_ready(client, owner, cid)
    vid = video["id"]
    assert (await _send(client, other, vid, 0, b"x")).status_code == 403
    assert (
        await client.patch(f"/videos/{vid}", other.access, json={"title": "no"})
    ).status_code == 403
    assert (await client.delete(f"/videos/{vid}", other.access)).status_code == 403
    assert (await client.delete(f"/videos/{vid}", owner.access)).status_code == 204
    assert (await client.get(f"/videos/{vid}")).status_code == 404
    assert not (videos_root() / vid).exists()


async def test_upload_validation(client: TestClient, make_user) -> None:
    owner = await make_user("owner")
    cid = await _channel(client, owner)
    start = lambda **kw: client.post(  # noqa: E731
        f"/communities/{cid}/videos",
        owner.access,
        json={"title": "t", "filename": "a.mp4", "size_bytes": 10, **kw},
    )
    assert (await start(filename="a.exe")).status_code == 400
    assert (await start(size_bytes=uploads.MAX_BYTES + 1)).status_code == 400
    assert (await start(size_bytes=0)).status_code == 422
    assert (await start(title="")).status_code == 422
    assert (await start(visibility="secret")).status_code == 422

    video = await _start(client, owner, cid, 5)
    assert (await _send(client, owner, video["id"], 0, b"123456")).status_code == 400  # too much
    assert (await _send(client, owner, video["id"], 0, b"")).status_code == 400  # empty


async def test_unplayable_files_fail_with_a_reason(
    client: TestClient, make_user, fake_ffmpeg
) -> None:
    owner = await make_user("owner")
    cid = await _channel(client, owner)
    fake_ffmpeg["info"] = media.MediaInfo(5.0, 640, 360, "hevc", "aac", frozenset({"mp4"}))
    video = await _upload_ready(client, owner, cid)
    assert video["status"] == VideoStatus.FAILED and "H.264" in video["error"]
    assert video["file_url"] is None
    assert not (videos_root() / video["id"]).exists() or not any(
        (videos_root() / video["id"]).iterdir()
    )

    fake_ffmpeg["info"] = media.MediaInfo(5.0, 640, 360, "h264", "ac3", frozenset({"mp4"}))
    assert "AAC" in (await _upload_ready(client, owner, cid))["error"]


async def test_visibility_and_listings(client: TestClient, make_user) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    await _upload_ready(client, owner, cid, title="Public one")
    unlisted = await _upload_ready(client, owner, cid, title="Unlisted one", visibility="unlisted")
    private = await _upload_ready(client, owner, cid, title="Private one", visibility="private")
    pending = await _start(client, owner, cid, 10, title="Pending one")

    def titles(resp) -> set[str]:
        return {v["title"] for v in resp.json()}

    guest = await client.get(f"/communities/{cid}/videos")
    assert titles(guest) == {"Public one"}
    assert titles(await client.get(f"/communities/{cid}/videos", fan.access)) == {"Public one"}
    assert titles(await client.get(f"/communities/{cid}/videos", owner.access)) == {
        "Public one",
        "Unlisted one",
        "Private one",
        "Pending one",
    }

    # Unlisted: anyone with the link. Private and unfinished: the owner only.
    assert (await client.get(f"/videos/{unlisted['id']}")).status_code == 200
    assert (await client.get(f"/videos/{private['id']}")).status_code == 404
    assert (await client.get(f"/videos/{pending['id']}", fan.access)).status_code == 404
    assert (await client.get(f"/videos/{private['id']}", owner.access)).status_code == 200

    # A <video> tag cannot send a header: the owner's token works as a query parameter.
    file = f"/videos/{private['id']}/file"
    assert (await client.get(file)).status_code == 404
    assert (await client.get(f"{file}?token={owner.access}")).status_code == 200
    assert (await client.get(f"{file}?token={fan.access}")).status_code == 404

    # Making it public lists it.
    patched = await client.patch(
        f"/videos/{private['id']}",
        owner.access,
        json={"visibility": "public", "title": "Now public"},
    )
    assert patched.json()["visibility"] == "public"
    assert "Now public" in titles(await client.get(f"/communities/{cid}/videos"))


async def test_browse_and_search_list_public_videos_only(client: TestClient, make_user) -> None:
    owner = await make_user("owner")
    cid = await _channel(client, owner, "soldering")
    await _upload_ready(client, owner, cid, title="Tuning the radio")
    await _upload_ready(client, owner, cid, title="Hidden radio", visibility="unlisted")
    secret = await _channel(client, owner, "secret")
    await client.patch(f"/communities/{secret}", owner.access, json={"is_private": True})
    await _upload_ready(client, owner, secret, title="Secret radio")

    listed = (await client.get("/browse/videos")).json()
    assert [v["title"] for v in listed["items"]] == ["Tuning the radio"] and listed["total"] == 1
    assert (await client.get("/browse/videos?q=nothing")).json()["total"] == 0
    assert (await client.get("/browse/videos?channel=soldering")).json()["total"] == 1
    assert (await client.get("/browse/videos?sort=sideways")).status_code == 422
    found = (await client.get("/search?q=radio")).json()
    assert [v["title"] for v in found["videos"]] == ["Tuning the radio"]


async def test_deleting_a_channel_removes_its_videos(client: TestClient, make_user) -> None:
    owner = await make_user("owner")
    cid = await _channel(client, owner)
    video = await _upload_ready(client, owner, cid)
    assert (videos_root() / video["id"]).exists()
    assert (await client.delete(f"/communities/{cid}", owner.access)).status_code == 204
    assert not (videos_root() / video["id"]).exists()
    assert (await client.get(f"/videos/{video['id']}")).status_code == 404


async def test_stale_uploads_are_purged_and_codec_rules() -> None:
    from datetime import UTC, datetime, timedelta

    from sqlalchemy import update

    from core.database import async_session_factory
    from models.video import Video

    # Pure checks: what browsers can play without re-encoding.
    media.check_playable(GOOD)
    media.check_playable(media.MediaInfo(3.0, 8, 8, "vp9", None, frozenset({"matroska", "webm"})))
    for bad in (
        media.MediaInfo(0.0, 8, 8, "h264", "aac", frozenset({"mp4"})),
        media.MediaInfo(3.0, 8, 8, "mpeg4", "aac", frozenset({"mp4"})),
        media.MediaInfo(3.0, 8, 8, "h264", "dts", frozenset({"mp4"})),
    ):
        with pytest.raises(media.UnplayableVideo):
            media.check_playable(bad)

    async with async_session_factory() as db:
        await db.execute(update(Video).values(updated_at=datetime.now(UTC) - timedelta(days=2)))
        await db.commit()
        await uploads.purge_stale_uploads(db)
