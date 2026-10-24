"""F8 operate: health, readiness, metrics and structured logs."""

import json
import logging

from tests.conftest import TestClient
from tests.test_gateway_chat import _join, _recv


async def test_ready_reports_database_and_redis(client: TestClient) -> None:
    resp = await client.http.get("/ready")
    assert resp.status_code == 200
    assert resp.json() == {"ready": True, "database": True, "redis": True}


async def test_ready_is_503_when_redis_is_down(client: TestClient, monkeypatch) -> None:
    from core.redis_client import redis_client

    async def broken() -> bool:
        raise ConnectionError("down")

    monkeypatch.setattr(redis_client, "ping", broken)
    resp = await client.http.get("/ready")
    assert resp.status_code == 503 and resp.json()["redis"] is False


async def test_metrics_count_requests_by_route_not_by_url(client: TestClient, make_user) -> None:
    fan = await make_user("fan")
    await client.get("/auth/me", fan.access)
    await client.get("/communities/00000000-0000-0000-0000-000000000000")
    body = (await client.http.get("/metrics")).text
    assert 'adda_http_requests_total{method="GET",route="/auth/me",status="200"}' in body
    # The id is a path parameter, so it must not become a label value.
    assert "00000000-0000-0000-0000-000000000000" not in body
    assert "adda_http_request_duration_seconds_bucket" in body


async def test_metrics_track_sockets_and_chat(client: TestClient, make_user, ws_url: str) -> None:
    import json as _json

    from prometheus_client import REGISTRY

    owner, fan = await make_user("owner"), await make_user("fan")
    cid = (
        await client.post("/communities", owner.access, json={"name": "M", "slug": "metrics"})
    ).json()["id"]
    before = REGISTRY.get_sample_value("adda_chat_messages_total") or 0
    ws = await _join(ws_url, fan, cid)
    assert (REGISTRY.get_sample_value("adda_ws_connections") or 0) >= 1
    await ws.send(
        _json.dumps(
            {"type": "chat_message", "channel": f"community/{cid}/chat", "data": {"content": "x"}}
        )
    )
    await _recv(ws, "chat_message")
    await ws.close()
    assert (REGISTRY.get_sample_value("adda_chat_messages_total") or 0) == before + 1


def test_json_logs_are_one_object_per_line() -> None:
    from core.logging import JsonFormatter

    record = logging.LogRecord("adda.access", logging.INFO, __file__, 1, "GET %s", ("/x",), None)
    record.status = 200
    line = JsonFormatter().format(record)
    parsed = json.loads(line)
    assert parsed["msg"] == "GET /x" and parsed["level"] == "INFO" and parsed["status"] == 200
    assert "\n" not in line
