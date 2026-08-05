"""Streaming service — talks to the mediamtx REST API.

Stream path convention: a community streams to `rtmp://<host>:1935/community/<id>`,
which becomes mediamtx path `community/<id>`. HLS is then served at
`<HLS_BASE_URL>/community/<id>/index.m3u8`.
"""

import httpx

from config import settings


def _community_path(community_id: str) -> str:
    return f"community/{community_id}"


async def _list_paths() -> list[dict]:
    """Return mediamtx's active paths (v2 API). Empty list on failure."""
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(
                f"{settings.mtx_api_url}/v3/paths/list",
                auth=(settings.mtx_api_user, settings.mtx_api_pass),
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("items", [])
    except Exception:
        return []


async def is_community_live(community_id: str) -> bool:
    """True if a ready source exists for the community's stream path."""
    path = _community_path(community_id)
    for item in await _list_paths():
        if item.get("name") == path and item.get("ready", False):
            return True
    return False


async def list_live_community_ids() -> list[str]:
    """All community stream paths currently live."""
    ids: list[str] = []
    for item in await _list_paths():
        name = item.get("name", "")
        if name.startswith("community/") and item.get("ready", False):
            ids.append(name.removeprefix("community/"))
    return ids


async def viewer_count(community_id: str) -> int:
    """Approximate viewer count (mediamtx readers) for a community stream."""
    path = _community_path(community_id)
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(
                f"{settings.mtx_api_url}/v3/paths/get/{path}",
                auth=(settings.mtx_api_user, settings.mtx_api_pass),
            )
            if resp.status_code != 200:
                return 0
            return len(resp.json().get("readers", []))
    except Exception:
        return 0


async def kick_publisher(community_id: str) -> None:
    """Disconnect any RTMP publisher currently streaming to this community.

    Used after a stream-key rotation so the change takes effect immediately
    (mediamtx only checks the key at connect time; the live connection has to
    be dropped to force a reconnect with the new key).
    """
    path = _community_path(community_id)
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(
                f"{settings.mtx_api_url}/v3/rtmpconns/list",
                auth=(settings.mtx_api_user, settings.mtx_api_pass),
            )
            resp.raise_for_status()
            for conn in resp.json().get("items", []):
                if conn.get("path") == path:
                    await client.post(
                        f"{settings.mtx_api_url}/v3/rtmpconns/kick/{conn['id']}",
                        auth=(settings.mtx_api_user, settings.mtx_api_pass),
                    )
    except Exception:
        # Best-effort: if mediamtx is unreachable, the rotation still took
        # effect in the DB (the old key is dead for new connections).
        return


def hls_url(community_id: str) -> str:
    return f"{settings.hls_base_url}/{_community_path(community_id)}/index.m3u8"


def webrtc_url(community_id: str) -> str:
    return f"{settings.webrtc_base_url}/{_community_path(community_id)}"
