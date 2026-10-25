---
title: "Going live with OBS"
description: "Keys, the setup tab, stream health and recordings."
---

Every channel has its own **stream key**. Going live is copying two values into OBS.

## Get the address

Open **Studio → Setup** (the Studio is in the avatar menu). You will see:

- **Server (RTMP URL)**, for example `rtmp://your-domain:1935/community`
- **Stream key**, hidden until you press the eye
- **Server and key together**, one address with the key included

Each has a copy button.

## Configure OBS

1. **Settings → Stream**
2. **Service:** `Custom…`
3. **Server** and **Stream key:** paste each, or paste the combined address into **Server** and
   leave the key empty
4. **Start Streaming**

The Studio flips to **LIVE** and the status line on the Setup tab changes to "Encoder
connected". Anything that speaks RTMP works: Streamlabs, vMix, hardware encoders, or
`ffmpeg … -f flv "<address>"`.

For a smooth stream in browsers use a keyframe interval of 2 seconds, x264 or hardware H.264,
and AAC audio.

## The Live tab

While you are live, **Studio → Live** shows:

- the stream as viewers see it, a few seconds behind
- viewers, uptime and the video and audio codecs
- chat, with moderation controls (see [Chat and moderation](/docs/guides/chat-and-moderation))
- **Start a poll** and the pinned message

The **End stream** button in the corner disconnects your encoder.

## Rotating the key

**Rotate key** (Setup tab) makes a new key and **disconnects the current encoder at once**, so a
leaked key is dead the moment you rotate. Update OBS with the new value afterwards.

## Recordings

Every broadcast is recorded while you are live. When you stop, it appears under your channel's
**Recordings** tab and plays in the browser, where viewers can download it and comment at a
moment in time. As the owner you can delete a recording from its page.

Recordings are written as they arrive, not transcoded, so their quality is your encoder's
quality.

## Troubleshooting

| Symptom                      | Fix                                                                         |
| ---------------------------- | --------------------------------------------------------------------------- |
| Stays offline                | Check the address includes `?key=…` and that port 1935 is open              |
| `403` when publishing        | The key does not match. Copy it again from Setup, especially after rotating |
| Viewers see stutter          | Lower the bitrate or resolution in OBS; playback is passthrough             |
| Video plays but chat is dead | `/ws` must reach the backend; the bundled Caddy config does this            |
