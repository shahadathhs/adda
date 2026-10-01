---
title: Going live (OBS)
description: Stream to your channel with OBS — keys, health, viewers, recordings.
---

Every channel (community) on adda has its own **stream key**. Broadcasting is
a two-step setup: copy the URL, paste it into OBS.

## Get your stream URL

1. Open **Browse** → your channel.
2. Go to the **Live** tab — as the owner you'll see **Stream setup (OBS)**.
3. Copy the **Stream URL** (it already contains your key as `?key=…`).

## Configure OBS

1. **Settings → Stream**
2. **Service:** `Custom`
3. **Server:** paste the Stream URL
4. **Stream Key:** *(leave empty — it's inside the URL)*
5. **Start Streaming**

The channel flips to **LIVE** on adda within a few seconds — both for you and
for anyone sitting on the channel page (it's pushed over WebSocket, not
polled).

:::note[Works with anything that speaks RTMP]
Streamlabs, vMix, FFmpeg (`ffmpeg -i input.mp4 -c copy -f flv "<STREAM URL>"`),
or a hardware encoder — they all work. adda accepts any RTMP publisher.
:::

## Stream title

In the **Live** tab, owners can set **what they're streaming today** — the
title shows on the channel page and on the Browse grid card while live.

## Stream health

The owner's **Stream health** card shows a live snapshot:

- **Status** — live/offline (sampled from mediamtx every 5s)
- **Viewers** — current HLS/WebRTC readers
- **Uptime** — since the monitor first saw the stream
- **Codecs** — video/audio codecs of the incoming tracks

## Viewer experience

Viewers get the HLS player with auto-reconnect, the live chat rail, and a
**Follow** button — followed channels appear in their **Following** rail on
Browse with a live indicator.

## Rotating the stream key

**Rotate key** (owner, Stream setup card) generates a new key and
**immediately disconnects the active publisher** — a leaked key is dead the
moment you rotate. Update OBS with the new Stream URL afterwards.

## Recordings

Streams are recorded automatically by mediamtx while live. When you stop,
the recording appears under the channel's **Recordings** tab with in-app
playback. Admins can browse and delete recordings across all channels from
the admin dashboard.

## Troubleshooting

| Symptom                        | Fix                                                            |
| ------------------------------ | -------------------------------------------------------------- |
| Status stays offline           | Check the URL includes `?key=…`; verify RTMP port 1935 is open |
| `403` on publish               | Key mismatch — rotate + re-copy the URL                        |
| Video stutters for viewers     | Passthrough HLS — lower your OBS output bitrate/resolution     |
| Chat works, video doesn't      | `HLS_BASE_URL` must be reachable from the viewer's browser     |
