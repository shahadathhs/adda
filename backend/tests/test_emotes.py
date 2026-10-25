"""F11: emotes — validated uploads, owner-only, limits."""

import struct
import zlib

from tests.conftest import Account, TestClient


def png(width: int = 16, height: int = 16) -> bytes:
    """A real, tiny PNG of the given size."""

    def chunk(kind: bytes, data: bytes) -> bytes:
        body = kind + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

    raw = b"".join(b"\x00" + b"\x00\x00\x00" * width for _ in range(height))
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw))
        + chunk(b"IEND", b"")
    )


def gif(width: int = 8, height: int = 8) -> bytes:
    return b"GIF89a" + struct.pack("<HH", width, height) + b"\x00\x00\x00;"


async def _channel(client: TestClient, owner: Account) -> str:
    resp = await client.post("/communities", owner.access, json={"name": "E", "slug": "emotes"})
    return resp.json()["id"]


async def _upload(
    client: TestClient, who: Account, cid: str, name: str, data: bytes, ct="image/png"
):
    return await client.post(
        f"/communities/{cid}/emotes",
        who.access,
        data={"name": name},
        files={"file": (f"{name}.png", data, ct)},
    )


async def test_the_owner_uploads_an_emote_and_everyone_can_see_it(
    client: TestClient, make_user
) -> None:
    owner = await make_user("owner")
    cid = await _channel(client, owner)
    resp = await _upload(client, owner, cid, "Chai", png())
    assert resp.status_code == 201 and resp.json()["name"] == "chai"

    listed = (await client.get(f"/communities/{cid}/emotes")).json()
    assert [e["name"] for e in listed] == ["chai"]
    image = await client.get(listed[0]["url"].removeprefix("/api"))
    assert image.status_code == 200 and image.headers["content-type"] == "image/png"
    assert image.content == png()
    state = (await client.get(f"/communities/{cid}/chat-state")).json()
    assert state["emotes"][0]["name"] == "chai"


async def test_gif_is_accepted_and_only_the_owner_can_upload(client: TestClient, make_user) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    assert (await _upload(client, owner, cid, "wiggle", gif(), "image/gif")).status_code == 201
    assert (await _upload(client, fan, cid, "nope", png())).status_code == 403
    assert (
        await client.post(
            f"/communities/{cid}/emotes", data={"name": "x1"}, files={"file": ("a.png", png())}
        )
    ).status_code == 401


async def test_the_bytes_are_sniffed_not_the_name_or_content_type(
    client: TestClient, make_user
) -> None:
    owner = await make_user("owner")
    cid = await _channel(client, owner)
    fake = await _upload(client, owner, cid, "fake", b"<svg onload=alert(1)>", "image/png")
    assert fake.status_code == 400 and "PNG, GIF or WebP" in fake.json()["detail"]
    html = await _upload(client, owner, cid, "page", b"<html></html>" * 20, "image/png")
    assert html.status_code == 400
    jpeg = await _upload(
        client, owner, cid, "photo", b"\xff\xd8\xff\xe0" + b"\x00" * 40, "image/png"
    )
    assert jpeg.status_code == 400  # JPEG is a real image but not an allowed emote type


async def test_size_and_dimension_limits(client: TestClient, make_user) -> None:
    owner = await make_user("owner")
    cid = await _channel(client, owner)
    big_px = await _upload(client, owner, cid, "huge", png(200, 20))
    assert big_px.status_code == 400 and "128" in big_px.json()["detail"]
    assert (await _upload(client, owner, cid, "edge", png(128, 128))).status_code == 201
    too_many_bytes = png() + b"\x00" * (257 * 1024)
    big = await _upload(client, owner, cid, "heavy", too_many_bytes)
    assert big.status_code == 400 and "256 KB" in big.json()["detail"]


async def test_names_are_validated_and_unique_and_capped_at_fifty(
    client: TestClient, make_user
) -> None:
    owner = await make_user("owner")
    cid = await _channel(client, owner)
    assert (await _upload(client, owner, cid, "a", png())).status_code == 400
    assert (await _upload(client, owner, cid, "bad name!", png())).status_code == 400
    assert (await _upload(client, owner, cid, "dupe", png())).status_code == 201
    assert (await _upload(client, owner, cid, "dupe", png())).status_code == 409
    for i in range(49):
        assert (await _upload(client, owner, cid, f"emote_{i:02d}", png())).status_code == 201
    over = await _upload(client, owner, cid, "one_more", png())
    assert over.status_code == 400 and "50" in over.json()["detail"]


async def test_removing_an_emote_deletes_it_and_its_file(client: TestClient, make_user) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    url = (await _upload(client, owner, cid, "gone", png())).json()["url"].removeprefix("/api")
    assert (await client.delete(f"/communities/{cid}/emotes/gone", fan.access)).status_code == 403
    assert (await client.delete(f"/communities/{cid}/emotes/gone", owner.access)).status_code == 204
    assert (await client.get(f"/communities/{cid}/emotes")).json() == []
    assert (await client.get(url)).status_code == 404
    assert (await client.delete(f"/communities/{cid}/emotes/gone", owner.access)).status_code == 404


async def test_emote_files_cannot_be_used_to_read_other_paths(client: TestClient) -> None:
    cid = "00000000-0000-0000-0000-000000000000"
    assert (await client.get(f"/emotes/{cid}/..%2f..%2fetc%2fpasswd")).status_code == 404
    assert (await client.get(f"/emotes/{cid}/not-a-key.png")).status_code == 404
