"""Two backend instances behind one Redis: chat, polls and reactions reach clients on both.

The in-process fake Redis cannot be shared between processes, so this test needs a real one and
is skipped unless `ADDA_TEST_REDIS_URL` is set (CI provides it; locally `make infra` is enough:
`ADDA_TEST_REDIS_URL=redis://localhost:6379/15 uv run pytest tests/test_two_instances.py`).
It starts two real uvicorn processes against the same Postgres and Redis.
"""

import asyncio
import json
import os
import socket
import subprocess
import sys

import httpx
import pytest
from websockets.asyncio.client import ClientConnection, connect

REDIS = os.environ.get("ADDA_TEST_REDIS_URL")
pytestmark = pytest.mark.skipif(not REDIS, reason="needs a real Redis: set ADDA_TEST_REDIS_URL")


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.fixture
async def instances():
    import redis.asyncio as aioredis

    real = aioredis.Redis.from_url(REDIS, decode_responses=True)
    await real.flushdb()
    env = {**os.environ, "REDIS_URL": REDIS}
    ports = [_free_port(), _free_port()]
    procs = [
        subprocess.Popen(
            [
                sys.executable,
                "-m",
                "uvicorn",
                "main:app",
                "--port",
                str(p),
                "--log-level",
                "warning",
            ],
            cwd=os.path.join(os.path.dirname(__file__), ".."),
            env=env,
        )
        for p in ports
    ]
    try:
        async with httpx.AsyncClient() as http:
            for port in ports:
                for _ in range(100):
                    try:
                        if (await http.get(f"http://127.0.0.1:{port}/health")).status_code == 200:
                            break
                    except httpx.HTTPError:
                        pass
                    await asyncio.sleep(0.2)
                else:
                    raise RuntimeError(f"instance on :{port} did not start")
        yield ports
    finally:
        for proc in procs:
            proc.terminate()
        for proc in procs:
            proc.wait(timeout=10)
        await real.flushdb()
        await real.aclose()


async def _recv(ws: ClientConnection, kind: str, timeout: float = 5.0) -> dict:
    async with asyncio.timeout(timeout):
        while True:
            msg = json.loads(await ws.recv())
            if msg["type"] == kind:
                return msg


async def test_chat_polls_and_reactions_reach_clients_on_both_instances(instances) -> None:
    one, two = instances
    async with httpx.AsyncClient(base_url=f"http://127.0.0.1:{one}/api") as api:

        async def register(name: str) -> dict:
            resp = await api.post(
                "/auth/register",
                json={
                    "username": name,
                    "email": f"{name}@example.com",
                    "display_name": name,
                    "password": "correct-horse-1",
                },
            )
            assert resp.status_code == 201, resp.text
            return resp.json()

        owner, fan = await register("owner"), await register("fanone")
        auth = {"authorization": f"Bearer {owner['access_token']}"}
        cid = (
            await api.post("/communities", headers=auth, json={"name": "Two", "slug": "two-inst"})
        ).json()["id"]
        topic = f"community/{cid}/chat"

        ws_fan = await connect(f"ws://127.0.0.1:{one}/ws?token={fan['access_token']}")
        ws_watch = await connect(f"ws://127.0.0.1:{two}/ws?token={owner['access_token']}")
        for ws in (ws_fan, ws_watch):
            await ws.send(json.dumps({"type": "subscribe", "channel": topic}))
            await _recv(ws, "subscribed")
        await asyncio.sleep(0.5)  # both Redis listeners are up

        # Chat: sent on instance one, delivered on instance two.
        await ws_fan.send(
            json.dumps({"type": "chat_message", "channel": topic, "data": {"content": "hello"}})
        )
        sent = (await _recv(ws_watch, "chat_message"))["data"]
        assert sent["content"] == "hello"

        # Reactions: toggled on one, counted on the other.
        await ws_fan.send(
            json.dumps(
                {
                    "type": "react",
                    "channel": topic,
                    "data": {"message_id": sent["id"], "emoji": "👍", "on": True},
                }
            )
        )
        update = (await _recv(ws_watch, "reaction_update"))["data"]
        assert update["counts"] == {"👍": 1}

        # Polls: started over HTTP on instance two, seen on instance one.
        resp = await httpx.AsyncClient().post(
            f"http://127.0.0.1:{two}/api/communities/{cid}/polls",
            headers=auth,
            json={"question": "Which?", "options": ["a", "b"], "duration_seconds": 60},
        )
        assert resp.status_code == 201
        started = (await _recv(ws_fan, "poll_started"))["data"]
        assert started["question"] == "Which?"

        await ws_fan.close()
        await ws_watch.close()
