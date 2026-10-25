---
title: "Uploading videos"
description: "Upload a video to your channel: formats, limits, resuming, who can watch, and what to do when it fails."
---

Besides live streams and the automatic recordings, a channel owner can upload finished videos.
Open **Studio → Videos**, choose a file (or drop it on the box), give it a title, pick who can
watch it, and press **Upload**.

Only the channel owner (and the server admin) can upload. Moderators, other accounts and guests
cannot.

## What you can upload

| Limit | Value                                    |
| ----- | ---------------------------------------- |
| Files | MP4, M4V, MOV or WebM                    |
| Size  | Up to 4 GB each                          |
| Video | H.264, VP8, VP9 or AV1                   |
| Audio | AAC, MP3, Opus, Vorbis or FLAC (or none) |

adda does **not** transcode. A video plays as you send it, so it has to be in a format browsers
play directly. H.264 with AAC in an MP4 plays everywhere. The server judges the file by looking
inside it, not by its name. If the codec is not supported, the video fails with a message that
names the codec and says what to re-encode it as.

## Uploading and resuming

The file is sent in 8 MB parts with a progress bar. If your connection drops, the page retries
by itself from where the server stopped, so you do not start over. Keep the page open while it
uploads; leaving asks you to confirm.

If you close the page anyway, the video stays in your list as **Paused at 40%**. Press
**Continue: choose the same file** and pick the same file again; it carries on from where it
stopped. Uploads nobody touches for 24 hours are removed.

## After the last part arrives

The video shows **Preparing…** while the server checks it, takes a poster frame and, for MP4 and
MOV files, moves the index to the front of the file (a copy, not a re-encode) so playback starts
at once and seeking works. A few seconds later it is **ready**. If something is wrong, it shows
**Failed** with the reason; delete it, fix the file and upload again.

## Who can watch

| Setting  | Meaning                                                           |
| -------- | ----------------------------------------------------------------- |
| Public   | Listed on your channel page, in the video directory and in search |
| Unlisted | Anyone with the link can watch; it is not listed anywhere         |
| Private  | Only you                                                          |

Use **Edit** on a video to change its title, description or visibility, and **Delete** to remove
it and its file. Deleting a channel deletes its videos.

## For the server host

Uploaded videos are stored in `uploads/videos/`, one folder per video, so include `uploads/` in
your [backups](/docs/operations). The backend image includes ffmpeg for checking files. If you
put your own reverse proxy in front of the API, it only has to allow request bodies of 8 MB.
