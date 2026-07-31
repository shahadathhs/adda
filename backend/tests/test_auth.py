import pytest

REGISTER = {
    "username": "sajib",
    "email": "sajib@example.com",
    "password": "supersecret",
    "display_name": "Sajib",
}


@pytest.mark.asyncio
async def test_register_returns_token(client):
    resp = await client.post("/api/auth/register", json=REGISTER)
    assert resp.status_code == 201
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["username"] == "sajib"


@pytest.mark.asyncio
async def test_register_duplicate_email_conflicts(client):
    await client.post("/api/auth/register", json=REGISTER)
    resp = await client.post("/api/auth/register", json=REGISTER)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post("/api/auth/register", json=REGISTER)
    resp = await client.post(
        "/api/auth/login",
        json={"email": "sajib@example.com", "password": "supersecret"},
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/api/auth/register", json=REGISTER)
    resp = await client.post(
        "/api/auth/login",
        json={"email": "sajib@example.com", "password": "wrong"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_auth(client):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_with_token(client):
    reg = await client.post("/api/auth/register", json=REGISTER)
    token = reg.json()["access_token"]
    resp = await client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == "sajib@example.com"
