---
title: "Video uploads: resumable parts and direct play"
description: "How adda accepts a 4 GB video without a job queue: parts at explicit offsets, ffprobe to decide, and a copy instead of a re-encode."
date: 2026-10-25
order: 1
tag: "Video"
image: "/blog/video-uploads-resumable-and-direct-play.svg"
---

Live streams and their recordings were the first half of adda. The second half is the video a
channel owner made earlier and wants to put on the channel. The design goal was the same as for
the streaming path: do as little as possible, and be honest about what that means.

## Parts at explicit offsets

A 4 GB file does not go through one request. The browser creates the video (title, file name,
size), then sends the file in 8 MB parts with `PUT /api/videos/{id}/chunk?offset=N`. The server
appends a part only if `N` equals the number of bytes it already has on disk. Anything else is a
`409`, and the video reports how much the server really holds.

That one rule is the whole resume story. After a dropped connection the client asks where the
server is and carries on from there; after closing the tab, the owner chooses the same file again
and the same loop runs from the stored count. The file system, not a counter in the database, is
the source of truth, so a part that arrived but was never acknowledged is not sent twice. Uploads
nobody touches for a day are removed.

## Deciding by looking inside

When the last part is in, a background task runs `ffprobe` on the file. The file name is never
trusted. The video must have a video track in a codec that browsers play directly (H.264, VP8,
VP9 or AV1), and its audio, if any, must be AAC, MP3, Opus, Vorbis or FLAC. Anything else
fails, and the message names the codec and what to re-encode it as.

There is no transcoding, and that is a deliberate scope decision: no queue, no extra CPU, no
second copy of the file at another size. The price is that the uploader owns the quality and the
codec.

## A copy, not a re-encode

An MP4 written by an editor usually has its index (the `moov` box) at the end of the file, which
means a browser has to download everything before it can seek. The server fixes that with a
stream copy: `ffmpeg -c copy -movflags +faststart`. The bytes of the video and audio are
untouched; only the index moves to the front. The same step takes a poster frame a tenth of the
way in.

The result is served with ordinary range requests, so seeking in a 2 GB file fetches only the
part you jump to. Private and unlisted videos accept the viewer's token as a query parameter,
because a `<video>` element cannot send an authorisation header.

## What it does not do

No adaptive bitrates, no thumbnail sprites, no comments on uploads yet, and no notification to
followers when one arrives. Those are separate pieces of work; the upload path itself is small
enough to read in one sitting.
