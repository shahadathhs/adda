from tests.conftest import TestClient


async def test_health(client: TestClient) -> None:
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
