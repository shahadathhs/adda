---
title: "Testing a streaming platform on a laptop"
description: "An embedded Postgres, an in-memory Redis, two real servers, and a browser watching a test pattern."
date: 2026-10-25
order: 10
tag: "Engineering"
image: "/blog/testing-a-streaming-platform-on-a-laptop.svg"
---

A platform with a database, a cache, a media server and a browser app sounds like it needs a
test environment the size of the product. adda's tests run on a laptop, with no Docker for the
backend tests, in about a minute.

## The backend tests need nothing installed

`make test` starts an **embedded Postgres** (a real one, started by the test harness in a temporary
folder), applies the **real Alembic migrations** to it, and swaps Redis for an in-memory fake. So
the tests exercise the real schema, the real constraints and the real queries. The migrations are
tested for free every run, because they are how the test database exists.

Anything that leaves the process is stubbed at the edge: calls to the media server fail fast and
are replaced in the tests that need them, and ffmpeg is faked for the video-upload tests so the
protocol can be checked without a video.

## One test that needs the real thing

Fan-out across servers cannot be proved with a fake. One test starts **two real server processes**
against one **real Redis** and checks that a chat message, a reaction and a vote sent to one reach
clients on the other. It runs when a Redis address is provided; CI provides one.

## A browser, a stream and a real stack

The end-to-end tests run Playwright against the whole stack in Docker. An ffmpeg **test pattern**
publishes to the media server, so the "live" pages have something real to play. The tests register
accounts through the API, sign in through the page, and then do what a person does: go live, watch
as a guest, chat, vote, time someone out, upload a video and watch it. They also run the channel
page at phone width and fail if it scrolls sideways.

That last check has caught real problems: a longer row of tabs once pushed the page 12 pixels
wider than a phone, and the test said so.

## The gates around it

Lint and type checks for both languages run on every push. A script, `check:design`, scans the web
code for patterns the design rules ban: the wrong colours, layout animations, radii off the scale.
It is a test for taste, and it is cheaper than arguing in review.

## What is not measured yet

A timed install on a clean server and latency numbers are still on the list. A test suite proves
the behaviour; it does not replace measuring the thing under load, and the docs say so.
