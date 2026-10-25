---
title: "Chat: saved first, then fanned out"
description: "Why every message is written to Postgres before anyone sees it, and how Redis carries it to every server."
date: 2026-10-25
order: 3
tag: "Chat"
image: "/blog/chat-saved-first-then-fanned-out.svg"
---

A chat room feels instant, so it is tempting to build it as a pipe: a message comes in and goes
straight out to everyone. adda does it the other way round. A message is **saved first**, and only
then sent to anyone.

## The order is the design

When a viewer sends a message over the WebSocket, the backend checks the rules, writes the row to
Postgres, and only after the write succeeds publishes it. Two things follow.

- Nobody ever sees a message that is not on disk. If the database is down, the sender gets an
  error instead of a message that vanishes on the next reload.
- History and live delivery are the same data. A viewer who joins late, or reconnects after a
  dropped connection, asks the REST endpoint for what they missed and gets exactly what the others
  saw, in the same order.

## Redis as the shared bus

One backend process can hold thousands of sockets, but you may run more than one. Every backend
instance subscribes to a single Redis channel and delivers each event to its own local sockets.
The instance that handled the message does not need to know who else is connected, or where.

Redis also holds the things that should be fast and are fine to lose: presence (a set per room),
slow-mode and rate-limit keys, and live poll tallies. None of them is the record. Restart Redis
and the worst case is that a rate-limit window resets.

## Busy rooms and batching

A room with a hot message can get hundreds of reactions a second. Sending one event per reaction
would make every client do pointless work, so reactions and poll updates are **coalesced**: the
server collects them for a quarter of a second and publishes the totals once.

## Guests read, accounts write

The same gateway serves guests. A connection with no token can subscribe and read; a bad token is
refused at the handshake; every write type answers `auth_required` for a guest. The check lives in
the gateway, not in the page, so a hand-written client gets nowhere.

## How it is checked

A test starts **two real server processes** against one real Redis, connects a client to each,
and sends a message, a reaction and a vote through one side. The assertion is that clients on both
sides receive them. It is the one test that needs a Redis server, so CI provides one.
