"""mediamtx REST API client.

A community streams to `rtmp://<host>:1935/community/<id>`, which becomes the
mediamtx path `community/<id>`. HLS is then served at
`<HLS_BASE_URL>/community/<id>/index.m3u8`.
"""

import httpx

from core.config import settings


def community_path(community_id: str) -> str:
    return f"community/{community_id}"


async def list_paths() -> list[dict]:
    """Return mediamtx's active paths (v3 API). Empty list on failure."""
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


async def path_details(community_id: str) -> dict | None:
    """Full mediamtx path object (readers, tracks) or None when not live."""
    path = community_path(community_id)
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(
                f"{settings.mtx_api_url}/v3/paths/get/{path}",
                auth=(settings.mtx_api_user, settings.mtx_api_pass),
            )
            if resp.status_code != 200:
                return None
            return resp.json()
    except Exception:
        return None


async def viewer_count(community_id: str) -> int:
    """Approximate viewer count (mediamtx readers) for a community stream."""
    path = community_path(community_id)
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
    path = community_path(community_id)
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


def track_codecs(details: dict | None) -> tuple[str | None, str | None]:
    """(video codec, audio codec) from a mediamtx path object.

    mediamtx 1.x lists `tracks` as plain codec names and puts the detail in
    `tracks2` (video tracks carry a width, audio tracks a sample rate); older
    versions listed `tracks` as objects with a `type`. Both shapes are read.
    """
    video: str | None = None
    audio: str | None = None
    for track in (details or {}).get("tracks2") or []:
        if not isinstance(track, dict):
            continue
        props = track.get("codecProps") or {}
        if "width" in props:
            video = video or track.get("codec")
        elif "sampleRate" in props:
            audio = audio or track.get("codec")
    for track in (details or {}).get("tracks") or []:
        if isinstance(track, dict):
            if track.get("type") == "video":
                video = video or track.get("codec")
            elif track.get("type") == "audio":
                audio = audio or track.get("codec")
    return video, audio
