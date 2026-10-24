"""F4 — go live: the mediamtx publish-auth webhook and admin force-stop."""

import uuid

from tests.conftest import Account, TestClient


async def _channel_with_key(client: TestClient, owner: Account) -> tuple[str, str]:
    created = await client.post(
        "/communities", owner.access, json={"name": "Live", "slug": "live-ch"}
    )
    cid = created.json()["id"]
    key = (await client.get(f"/communities/{cid}/stream-key", owner.access)).json()["stream_key"]
    return cid, key


def _publish(path: str, key: str | None) -> dict:
    return {"action": "publish", "path": path, "query": f"key={key}" if key else ""}


async def test_publish_with_the_right_key_is_allowed(client: TestClient, make_user) -> None:
    cid, key = await _channel_with_key(client, await make_user("nila"))
    resp = await client.post("/streams/auth", json=_publish(f"community/{cid}", key))
    assert resp.status_code == 200


async def test_publish_with_a_wrong_or_missing_key_is_refused(
    client: TestClient, make_user
) -> None:
    cid, _ = await _channel_with_key(client, await make_user("nila"))
    wrong = await client.post("/streams/auth", json=_publish(f"community/{cid}", "sk_wrong"))
    missing = await client.post("/streams/auth", json=_publish(f"community/{cid}", None))
    assert wrong.status_code == missing.status_code == 403


async def test_publish_to_the_wrong_path_is_refused(client: TestClient, make_user) -> None:
    _, key = await _channel_with_key(client, await make_user("nila"))
    for path in ("live/stream", "community/not-a-uuid", f"community/{uuid.uuid4()}", ""):
        resp = await client.post("/streams/auth", json=_publish(path, key))
        assert resp.status_code == 403, path


async def test_a_key_cannot_publish_to_another_channels_path(client: TestClient, make_user) -> None:
    nila, sam = await make_user("nila"), await make_user("sam")
    _, nila_key = await _channel_with_key(client, nila)
    other = await client.post("/communities", sam.access, json={"name": "Sam", "slug": "sam-ch"})
    resp = await client.post(
        "/streams/auth", json=_publish(f"community/{other.json()['id']}", nila_key)
    )
    assert resp.status_code == 403


async def test_publish_query_with_extra_parameters_still_works(
    client: TestClient, make_user
) -> None:
    cid, key = await _channel_with_key(client, await make_user("nila"))
    body = {"action": "publish", "path": f"community/{cid}", "query": f"foo=bar&key={key}"}
    assert (await client.post("/streams/auth", json=body)).status_code == 200


async def test_reads_are_not_gated(client: TestClient) -> None:
    for action in ("read", "playback", "api"):
        resp = await client.post("/streams/auth", json={"action": action, "path": "community/x"})
        assert resp.status_code == 200, action


async def test_malformed_webhook_body_is_not_a_server_error(client: TestClient) -> None:
    resp = await client.post("/streams/auth", content=b"not json")
    assert resp.status_code in (200, 403)


async def test_old_key_stops_working_after_rotation(
    client: TestClient, make_user, mediamtx: list[str]
) -> None:
    owner = await make_user("nila")
    cid, old_key = await _channel_with_key(client, owner)
    new_key = (await client.post(f"/communities/{cid}/stream-key/rotate", owner.access)).json()[
        "stream_key"
    ]

    old = await client.post("/streams/auth", json=_publish(f"community/{cid}", old_key))
    new = await client.post("/streams/auth", json=_publish(f"community/{cid}", new_key))
    assert old.status_code == 403
    assert new.status_code == 200


# ── force-stop (admin) ────────────────────────────────────────────────
async def test_admin_can_force_stop_a_stream(
    client: TestClient, make_user, make_admin, mediamtx: list[str]
) -> None:
    cid, _ = await _channel_with_key(client, await make_user("nila"))
    admin = await make_admin()
    resp = await client.post(f"/admin/communities/{cid}/stop", admin.access)
    assert resp.status_code == 204
    assert mediamtx == [cid]


async def test_force_stop_is_admin_only(client: TestClient, make_user, mediamtx: list[str]) -> None:
    owner = await make_user("nila")
    cid, _ = await _channel_with_key(client, owner)
    assert (await client.post(f"/admin/communities/{cid}/stop", owner.access)).status_code == 403
    assert (await client.post(f"/admin/communities/{cid}/stop")).status_code == 401
    assert mediamtx == []


async def test_force_stop_unknown_channel_is_404(client: TestClient, make_admin) -> None:
    admin = await make_admin()
    resp = await client.post(f"/admin/communities/{uuid.uuid4()}/stop", admin.access)
    assert resp.status_code == 404
