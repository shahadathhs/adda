<!--
=====================================================================
DRAFT NOTES — delete this block before publishing
=====================================================================

Title options (pick one):
  1. Building a Self-Hosted Twitch: RTMP → HLS with mediamtx, and the
     Auth Webhook That Took Me Three Tries        ← recommended
  2. Live Streaming Is Just Webhooks and HLS — Self-Hosting a Stream
     Server That Only You Can Publish To
  3. From "Anyone Can Stream" to Per-Community Keys: Taming mediamtx

Subtitle: How one open-source binary and a 60-line webhook gave a
community platform live streaming, viewer counts, force-stop, and
recordings — for free.

Tags: streaming, mediamtx, rtmp, hls, webrtc, fastapi, docker,
self-hosting, backend

Where to submit: JavaScript in Plain English took two of your posts,
but this is infra/Python — consider Level Up Coding or Better
Programming, or self-publish first and gauge.

Cover: needs your hand-drawn infographic style (OBS → mediamtx →
viewers, with the webhook callout to the backend).

PERSONALIZE before publishing (only you know these):
  · Section 2 — how did you FIRST notice ingest was open? (port scan?
    re-read the docs? a friend?) Replace my framing with the real
    moment.
  · Section 3 — the rotation story: did you discover it while testing,
    or did you predict it? My draft implies you tested it live.
  · Section 4 — the WebRTC-in-Docker afternoon: how long did the ICE
    thing actually take, and what did the logs look like?
  · Re-order walls 2/3/4 to match what actually happened. Git history
    shows: API-auth fix (early) → WebRTC/latency → stream keys + webhook
    + rotation. My draft orders by teaching value, not chronology.

TECH CHECK (one thing I could not verify from the repo):
  · mediamtx.yml does NOT set apiUser/apiPass, but the repo's own
    config comment says the API is admin/admin, and the backend sends
    basic auth. Either latest mediamtx defaults to admin/admin or the
    comment is stale — verify before claiming it in print. Section 5
    is phrased to be safe either way, but double-check your deployed
    config.

RESEARCH vs. EXISTING CONTENT (2026-09-29 web sweep):
  · Nobody has written a third-party tutorial on real per-entity
    publish-auth webhooks — the mechanism exists only in official docs.
    That's the moat; sections 2–3 lead with it.
  · "Self-hosted Twitch" search results = Owncast setup guides +
    legacy nginx-rtmp tutorials (2013–2022). Added the "Why not
    Owncast (or nginx-rtmp)?" section to capture comparison-intent
    traffic (owncast vs / nginx-rtmp alternative) and position the
    piece as the multi-tenant/embeddable angle nobody covers.
  · The rotate-key-but-stream-keeps-going story exists only as
    fragments: SRS API docs, Wowza forum threads, nginx-rtmp's
    /control/drop endpoint. No cohesive article. Section 3 owns it.
  · WebRTC-in-Docker ICE trap: scattered GitHub discussions only —
    section 4 is the cohesive write-up. Added the two footnotes the
    discussions converge on: Linux needs
    extra_hosts: host-gateway, and 8189/udp must be published.
  · Newer mediamtx supports authJWTJWKS — noted as the zero-webhook
    alternative in "What's still weak". Docs URL updated to
    mediamtx.org (readthedocs is stale).

Companion repo: https://github.com/shahadathhs/adda
=====================================================================
-->

# Building a Self-Hosted Twitch: RTMP → HLS with mediamtx, and the Auth Webhook That Took Me Three Tries

The first time I clicked **Start Streaming** in OBS against my own server, it just worked.

```
✓ Stream started
00:00:03 (live)
```

No key. No error. No hesitation. That's when I got suspicious — I hadn't configured any authentication. Which meant that **anyone who found my server could stream to it too**, on any path they liked, and my platform would happily serve it to viewers.

This is the story of locking that door properly — and the two more walls I hit after it: a key rotation that didn't actually revoke anything, and a twenty-second delay between "live" and "watchable." All of it on top of a single open-source binary, [mediamtx](https://github.com/bluenviron/mediamtx), and a webhook that ended up being about sixty lines of FastAPI.

Everything below runs in production (well, "production") in [adda](https://github.com/shahadathhs/adda), a self-hosted community platform I built — text channels, live streaming, recordings. The stream code is real, not simplified for the article.

---

## The mental model

Before touching config, the picture that makes everything else obvious. Live streaming has a **data plane** (the video) and a **control plane** (who's allowed, who's live, how many are watching). mediamtx handles the data plane entirely on its own. Your backend never touches a video byte — it only participates in the control plane, through exactly two channels: a **webhook** mediamtx calls, and a **REST API** your backend calls.

```
                 DATA PLANE (video — mediamtx handles it all)
  OBS ──RTMP──►  mediamtx  ──HLS────►  browser (hls.js)
  (publish)        │        └─WebRTC──►  browser (sub-second)

                 CONTROL PLANE (your backend)
  mediamtx ──webhook──► backend   "may this publisher in?"  (push)
  backend  ──REST────► mediamtx  "who's live? viewers?"    (pull)
```

And the three protocols, in one breath:

- **RTMP** — how video *enters*. Old (2002, Macromedia), but every encoder on earth still speaks it: OBS, Streamlabs, ffmpeg. It is the loading dock.
- **HLS** — how most viewers *watch*. Video chopped into segments, served over plain HTTP with a playlist file. Plays anywhere, survives bad networks, but arrives on a schedule. It is the delivery truck.
- **WebRTC** — how impatient viewers watch. Sub-second, peer-to-peer-ish, and famously finicky. It is the motorcycle courier.

One more thing, the trick that makes the whole integration small: **the stream path is the join key**. A community streams to `community/<id>`, and that same string is the HLS URL, the WebRTC URL, the recording folder, and the API path. No mapping table anywhere — the convention *is* the database join.

---

## Why not Owncast (or nginx-rtmp)?

Fair question — this space has two default answers, and neither fit.

**[Owncast](https://owncast.online)** is a turnkey, self-hosted, single-channel Twitch: one streamer, built-in chat, a nice UI, done. If that's your product, stop reading and install it — it's genuinely good at that job. But it's *one streamer per instance*. adda needed **many** streamers — every community with its own key, its own live tab, its own recordings. That's multi-tenant, and multi-tenant means you don't want a streaming *app*, you want a streaming *component* to embed.

**nginx-rtmp** is the classic tutorial path — it's what most "build your own streaming server" articles walk through. But the module is effectively unmaintained, it speaks RTMP→HLS but not WebRTC, and per-user publish auth means grappling with `on_publish` callbacks inside nginx config. It was the right answer in 2015.

mediamtx splits the difference: one zero-dependency binary that speaks every ingest and playback protocol, with authentication delegated to **your** server over a webhook, plus a clean REST API for control. (SRS is the other solid contender — similar shape, fine choice too.) You bring the product; it brings the pipes.

---

## 1. The naive version (and why "it works" is a warning)

mediamtx is famous for working with zero config. Download, run, and this already streams:

```yaml
# mediamtx.yml — the entire "works instantly" config
rtmp: yes
hls: yes
```

Point OBS at `rtmp://your-server:1935/community/abc-123`, open `http://your-server:8888/community/abc-123/index.m3u8` in a player, and there's your video. Instant gratification.

And a wide-open mic. Nothing asked who I was. `community/abc-123` isn't a reserved name — any path works, so a stranger can publish `community/<your-community-id>` and impersonate your stream, or invent their own paths and use your bandwidth. On a public IP, this is an open ingest server with a web player included.

So, requirements for the real thing:

1. Only the community **owner** can publish to their community's path.
2. **Viewers** need no key, no account, nothing — playback stays public.
3. The owner can **rotate** the credential instantly (shared it with a co-streamer, changed my mind, whatever).
4. Watchable in a browser within a few seconds of "live."

---

## 2. Wall #1 — locking the door: per-community keys + a 60-line webhook

mediamtx has no users table and doesn't want one. Instead it has `authMethod: http` — on every action, it POSTs a JSON description of that action to *your* server, and your server says yes or no. Authentication becomes your problem, which is exactly what you want, because you already have users.

Here's the streaming section of my `mediamtx.yml`:

```yaml
authMethod: http
authHTTPAddress: http://backend:7001/api/streams/auth
authHTTPExclude:
  - action: read
  - action: playback
  - action: api
  - action: metrics
  - action: pprof
```

**Why does `authHTTPExclude` exist?** Two reasons, and the first one matters more than it looks:

- **Watching must never require a key.** `read` and `playback` are excluded, so viewers hit HLS directly and anonymously. Requirement #2, solved by config.
- **The key must never appear in a public URL.** This drove the whole credential design (next paragraph).

Now the credential. The obvious design — key in the stream path, `rtmp://host:1935/community/abc-123?…` no wait, the *tempting* design is key-as-path: `rtmp://host:1933/live/sk_9xK2…`. Reject it. **The path leaks everywhere**: it becomes the public HLS URL, the recording folder, the API path. Instead, the key rides as a query parameter that exists only for the RTMP handshake:

```python
def build_stream_credentials(community: Community) -> StreamCredentialsOut:
    """RTMP URL (with key) + raw key for OBS setup.

    The key travels in the RTMP URL (?key=...) so it never appears in the
    public HLS path, which stays `community/<id>`.
    """
    url = f"{settings.rtmp_base_url}/community/{community.id}?key={community.stream_key}"
    return StreamCredentialsOut(stream_url=url, stream_key=community.stream_key)
```

And the key itself is just `"sk_" + secrets.token_urlsafe(24)` — one column on the community, unique-indexed, re-generatable.

The webhook on the backend, nearly in full, because it really is this small:

```python
@router.post("/auth")
async def mediamtx_auth(request: Request, db: AsyncSession = Depends(get_db)) -> Response:
    body = await request.json()

    # Anything that isn't a publish is allowed
    # (reads/playback/api are excluded in mediamtx.yml anyway).
    if body.get("action") != "publish":
        return Response(status_code=status.HTTP_200_OK)

    raw_path = (body.get("path") or "").split("?", 1)[0]
    key = parse_qs(body.get("query") or "").get("key", [""])[0]

    if not raw_path.startswith("community/") or not key:
        return Response(status_code=status.HTTP_403_FORBIDDEN)

    community_id = uuid.UUID(raw_path[len("community/"):])   # ValueError → 403

    community = (await db.execute(
        select(Community).where(Community.id == community_id)
    )).scalar_one_or_none()

    if community is None or community.stream_key != key:
        return Response(status_code=status.HTTP_403_FORBIDDEN)

    return Response(status_code=status.HTTP_200_OK)
```

Walk through what mediamtx sends and what we enforce:

- **Path must be `community/<uuid>`** — so nobody can invent arbitrary paths to squat on. One format, one lookup.
- **Key must match that community's key** — so only the owner (whoever holds the key) can publish *to that specific community*. You can't use your key on someone else's community.
- **200 = allow, 403 = deny.** mediamtx just checks the status code.

A nice OBS detail for your users: the key is already inside the stream URL (`…?key=sk_…`), so in OBS you paste the full thing into **Server** and leave OBS's *Stream Key* field **empty**. Pasting it in both places breaks the URL — this is a support-ticket generator, so I put the instruction directly in the UI.

<!-- ✏️ Personalize: the actual moment you realized ingest was open —
     port scan? re-reading docs? Add it here in one or two sentences. -->

---

## 3. Wall #2: rotating the key doesn't kick anyone

With keys working, I rotated one while a stream was live — and the stream **kept going**.

Here's the thing nobody tells you: **mediamtx validates the key once, at connect time.** After that, the connection is trusted until it drops. Rotating the key in my database changed nothing for the connection already pumping video. The old key was dead for *new* connections, sure — but the current publisher could stream until the heat death of the server.

The fix has two halves, and both are needed:

```python
@router.post("/{community_id}/stream-key/rotate", response_model=StreamCredentialsOut)
async def rotate_stream_key(...):
    community = await _get_owned_community(community_id, current_user, db)
    community = await regenerate_stream_key(db, community)
    # Drop the current OBS connection so the new key takes effect now;
    # reconnecting requires the rotated key (the old one is dead in the DB).
    await kick_publisher(str(community.id))
    return build_stream_credentials(community)
```

1. Rotate in the DB (instantly invalid for new connections).
2. **Kick the live connection**, so OBS is forced to reconnect — and reconnecting means going through the webhook again, with the new key.

The kick itself is two API calls — find the RTMP connection on that path, kick it by id:

```python
async def kick_publisher(community_id: str) -> None:
    """Disconnect any RTMP publisher currently streaming to this community."""
    path = f"community/{community_id}"
    async with httpx.AsyncClient(timeout=2.0) as client:
        resp = await client.get(
            f"{settings.mtx_api_url}/v3/rtmpconns/list", auth=...)
        for conn in resp.json().get("items", []):
            if conn.get("path") == path:
                await client.post(
                    f"{settings.mtx_api_url}/v3/rtmpconns/kick/{conn['id']}", auth=...)
```

Two design notes worth stealing:

- The kick is **best-effort**. If mediamtx is unreachable, we swallow it — the rotation already happened in the DB, so the old key is dead regardless. The kick only accelerates the inevitable; it isn't load-bearing for security.
- The same `kick` endpoint doubles as **admin force-stop** — one primitive, two product features (rotate-and-disconnect, and "shut this stream down now" from the dashboard).

<!-- ✏️ Personalize: did you catch this by testing, or did you predict
     it while writing the route? -->

---

## 4. Wall #3: twenty seconds behind live

Auth done, I started actually watching my own streams. Classic HLS put viewers **10–30 seconds behind** the moment. For a "community goes live, chat reacts" product, that's chat replying to ghosts.

Three fixes, in increasing pain:

**Fix 1 — Low-Latency HLS, one line:**

```yaml
hlsVariant: lowLatency
```

LL-HLS serves partial segments instead of waiting for full ones: **~1–3s glass-to-glass** instead of 10–30s. [hls.js](https://github.com/video-dev/hls.js/) on the frontend speaks it out of the box.

**Fix 2 — the invisible one:** by default, mediamtx only generates the HLS stream **when the first viewer requests it**. Result: the first person to open the Live tab after a stream starts sees a loading flicker while the playlist spins up. One line kills it:

```yaml
hlsAlwaysRemux: yes   # generate HLS while publishing, not on first request
```

**Fix 3 — WebRTC, and an afternoon I want back.** For genuinely live-feeling live, WebRTC gets you sub-second. `webrtc: yes`, and the player gets a second URL to try. But inside Docker it *silently fails*: the browser and server complete the HTTP handshake, then no media flows, and **the logs look fine.**

The cause: WebRTC connects over ICE, and mediamtx advertises the network addresses it can see — inside a container, that's the container's internal IP. The browser, outside Docker, receives a candidate it can't route to and gives up quietly. Two lines:

```yaml
# Advertise host-reachable ICE candidates. Inside Docker, mediamtx otherwise
# only gathers the container's internal IP (not reachable from the host
# browser), so the WebRTC media flow never establishes.
webrtcAdditionalHosts: ["host.docker.internal", "127.0.0.1"]
```

This is my favorite class of bug: **everything is "up," nothing is wrong in the logs, and the product is broken.** When WebRTC mysteriously doesn't connect in containers, check what addresses ICE is advertising before you check anything else.

Two footnotes that save the next person an afternoon:

- **On Linux hosts**, `host.docker.internal` doesn't resolve from inside a container by default. Compose needs one line: `extra_hosts: ["host.docker.internal:host-gateway"]`. (Docker Desktop on macOS/Windows does this for you, which is exactly why the bug "works on my machine.")
- **Publish the UDP port.** The WebRTC *handshake* is HTTP on 8889, but the *media* flows over UDP on 8189. If you only publish the TCP port, you get — again — a successful handshake, fine-looking logs, and no video. My compose maps `8189:8189/udp` for exactly this reason.

<!-- ✏️ Personalize: how long did the ICE thing take, and what did you
     try first? (NAT? firewall? TURN server research spiral?) -->

---

## 5. The control plane: one poll, three product features

Here's the part I find most elegant about this architecture. These product features —

- *"which communities are live right now?"* (the Live tab)
- *"how many viewers does this stream have?"*
- *"force-stop this stream"* (admin dashboard)

— are all served by **one HTTP GET** against mediamtx, plus the convention that streams live at `community/<id>`:

```python
async def list_live_community_ids() -> list[str]:
    """All community stream paths currently live."""
    ids: list[str] = []
    for item in await list_paths():                 # GET /v3/paths/list
        name = item.get("name", "")
        if name.startswith("community/") and item.get("ready", False):
            ids.append(name.removeprefix("community/"))
    return ids
```

The API lists every active path; `community/` prefix + `ready: true` = live. Viewer count is the same idea — `GET /v3/paths/get/community/<id>` and count `readers`. Force-stop is the `kick` from section 3. **No state about streams lives in my database at all.** mediamtx is the source of truth for what's streaming; Postgres is the source of truth for who may. Each store owns exactly what it's good at.

Two honest caveats:

- This is **polling**, not push. mediamtx can also POST event webhooks, and at bigger scale I'd switch live-status to that. At self-hosted scale, a poll per dashboard view is nothing.
- The control API needs credentials (the backend sends basic auth on every call). **Change the defaults before exposing port 9997** — an open mediamtx API lets anyone kick publishers or read path info.

Fun fact from my git history: "backend can't read the API because of auth" was literally one of the first fixes in the project — before any of the fancy stuff. The control plane comes online before the door is even locked.

---

## 6. Recordings: the feature I got for free

I expected recordings to be a project. They're a config block:

```yaml
pathDefaults:
  record: yes
  recordPath: /media/%path/%Y-%m-%d_%H-%M-%S
  recordFormat: fmp4
  recordSegmentDuration: 1h     # split long streams into hourly files
  recordDeleteAfter: 720h       # ⚠ 30-day retention — set 0 to keep forever
```

`%path` is the stream path, so — because the path is the join key — **recordings file themselves per community**, in fMP4 (playable in browsers directly), split hourly. A stream ends, and the recording is already sitting in a folder named after the community.

The wiring is one bind mount, shared by two containers (this is the pattern from [my Docker deep-dive](https://medium.com/@shahadathhs)):

```yaml
mediamtx:
  volumes:
    - ./recordings:/media      # mediamtx writes here

backend:
  volumes:
    - ./recordings:/recordings # backend serves the same host dir
```

Same host directory, two mount points. mediamtx never knows an API exists; the backend never knows mediamtx exists; the disk folder is the interface. When a stream ends, the "Recordings" tab just starts returning the new file.

Watch out for `recordDeleteAfter` — 30 days of retention deleting itself is a *surprise* if you expected archives forever. Set `0` to keep everything, and budget disk accordingly (video adds up fast).

---

## 7. What's still weak

In the spirit of *including the failures*:

- **No transcoding.** Viewers get whatever bitrate OBS sends. One viewer on hotel wifi = buffering. Real Twitch transcodes into a ladder (1080p/720p/480p…); that's a whole additional service (ffmpeg or a transcoder) I haven't built.
- **Polling for live status** instead of event webhooks. Fine now, sloppy at scale.
- **The stream key is a bearer secret in a URL.** It shows up in OBS logs and possibly in router logs on the ingest side. Acceptable for this threat model; wouldn't be for payments-grade auth.
- **WebRTC encryption is off** in my dev config (`webrtcEncryption: no`) — fine for localhost, must be revisited for any real deployment.
- Newer mediamtx versions also speak **JWT natively** (`authJWTJWKS`) — if your auth decision fits inside token claims instead of a database lookup, you can skip the webhook entirely. Mine doesn't (keys live per-community in Postgres, and I want rotation to be a DB write), so webhook it is.

---

## Cheat sheet

The mediamtx knobs that did all the work:

```yaml
authMethod: http                    # delegate auth to your backend
authHTTPAddress: http://backend:7001/api/streams/auth
authHTTPExclude: [read, playback, api, metrics, pprof]  # watching stays keyless

hlsVariant: lowLatency              # 10–30s → 1–3s
hlsAlwaysRemux: yes                 # no first-viewer loading flicker

webrtc: yes                         # sub-second playback
webrtcAdditionalHosts: ["host.docker.internal", "127.0.0.1"]  # the Docker ICE fix

pathDefaults:
  record: yes                       # VOD for free
  recordPath: /media/%path/%Y-%m-%d_%H-%M-%S   # files per community, hourly
  recordDeleteAfter: 720h           # ⚠ 30 days, then gone

paths:
  all_others:                       # accept community/<id> dynamically
```

The three control-plane calls:

| Call | Gives you |
|---|---|
| `GET /v3/paths/list` | every live path → your "who's live" feature |
| `GET /v3/paths/get/<path>` | `readers` array → viewer count |
| `GET /v3/rtmpconns/list` → `POST /v3/rtmpconns/kick/<id>` | force-stop / enforce key rotation |

---

## The mental map

```
ONE BINARY (mediamtx) = data plane
  OBS ──rtmp://host/community/<id>?key=sk_…──► mediamtx
                                                  ├── HLS  :8888  (1–3s, hls.js)
                                                  ├── WebRTC :8889 (sub-second)
                                                  └── records → /media/community/<id>/

ONE WEBHOOK (60 lines) = the door
  mediamtx ─ "action=publish, path=community/<id>, key=sk_…" ─► backend ─ 200/403

ONE POLL = the dashboard
  backend ─ /v3/paths/list ─► mediamtx ─► live? viewers? → kick
  (the path IS the join key — no stream state in your DB)
```

## What to learn next

- [mediamtx docs](https://mediamtx.org/docs/) — read the `authHTTPAddress` and `record*` sections even if you use nothing else; it's the best-documented streaming server I've used
- [Low-Latency HLS in hls.js](https://github.com/video-dev/hls.js/) — if you're serving web players, LL-HLS is the default you want
- WebRTC ICE candidates — the concept that cost me an afternoon in section 4
- [Owncast](https://owncast.online) — if you read section "Why not Owncast" and realized single-streamer turnkey *is* your product

**Related reading:** [Docker Explained Through a Real Backend Application](https://medium.com/@shahadathhs) — the shared-bind-mount pattern in section 6 comes straight from there. [Deploying a pnpm Monorepo on a Small AWS Instance](https://medium.com/@shahadathhs) — same "small box, real constraints" philosophy.

The full, working, not-simplified code lives in [shahadathhs/adda](https://github.com/shahadathhs/adda) — the webhook in `backend/modules/streaming/webhook.py`, the mediamtx config in `mediamtx/mediamtx.yml`.

---

*What would you stream if the only cost was your own server? I'm collecting excuses to build the transcode ladder next — tell me yours.*
