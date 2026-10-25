---
title: "RTMP in, HLS out, one auth webhook"
description: "How adda turns an encoder's stream into a watchable, recorded, chat-enabled channel with very little code."
date: 2026-10-25
order: 2
tag: "Streaming"
image: "/blog/rtmp-in-hls-out-one-auth-webhook.svg"
---

Streaming looks like a hard problem until you split it. adda's streaming path is three
pieces, and only one of them is ours.

## The shape

An encoder such as OBS pushes **RTMP**. A media server, [mediamtx](https://github.com/bluenviron/mediamtx),
accepts it and writes two things: **HLS** segments that browsers can play, and **MP4**
recordings on disk. adda's backend does not touch video at all. What it owns is the part
around it: who may publish, who is live, and everything that happens in the room.

## One webhook is the whole security model

mediamtx can ask an HTTP endpoint whether a connection is allowed. adda points it at
`POST /api/streams/auth`. For a publish, the path must be `community/<channel id>` and the query
must carry that channel's current key. Anything else is a `403`.

```text
rtmp://host:1935/community/<channel id>?key=<stream key>
```

Rotating a key writes a new one to the database and tells mediamtx to drop the current
publisher, so a leaked key stops working at once. Reads are excluded from the check, so viewing
never needs a key and the key never appears in a playback URL.

## Knowing who is live

The backend runs a small monitor that asks mediamtx for its paths every five seconds. When a
channel appears or disappears it records the start time, broadcasts a `stream_status` event
over the WebSocket, rings the bell of followers (and emails the ones who asked, at most once an
hour per channel) and starts or stops the thumbnail grabber. Pages react instantly because
they are told, not because they poll.

## Chat is a separate, boring problem

Chat is one WebSocket endpoint. A message is validated, saved to Postgres, and then published to
Redis; every backend instance listens and delivers to its own sockets. That is the whole fan-out,
and it is why running two instances behind one Redis works. A test starts two real server
processes against one Redis and checks that chat, reactions and polls reach clients on both.

Reactions and poll updates are coalesced before they are published, so one busy message cannot
flood the room.

## What it costs you

Because playback is passthrough HLS, there is no transcoding: the CPU use of a whole channel is
close to zero, and quality is whatever the encoder sends. The price is that every viewer pulls
the encoder's bitrate, so your upload bandwidth is the real limit. For a larger audience, put a
CDN in front of the HLS path.

That trade is the point of adda: a small stack you can read in an afternoon and run on a cheap
server.
