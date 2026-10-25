---
title: "The bell, and the one email an hour"
description: "Notifications that are quiet by default: an in-app bell, per-channel choices, and email only if you ask."
date: 2026-10-25
order: 11
tag: "Product"
image: "/blog/the-bell-and-the-one-email-an-hour.svg"
---

A notification system is easy to build and easy to make annoying. adda's has three kinds of
notification and one hard limit.

## What notifies you

- A channel you follow **goes live**.
- Someone **mentions** you in chat.
- Someone **replies** to your message.

They arrive in a bell in the top bar, which updates over the same WebSocket as everything else. You
can open it, read them and mark them read. There is nothing else: no digests, no marketing mail.

## Per-channel choices

On **Settings → Notifications** you choose, for each channel you follow, whether you get the bell,
and whether you also get an email. Muting one noisy channel does not mean leaving it.

## Email is opt-in, and capped

Email is off until you turn it on for a channel. When a channel goes live, followers who opted in
get a message, but **at most one an hour per channel**, however many times the stream drops and
returns. The limit is a key in Redis that expires after an hour, so an encoder that restarts four
times in ten minutes sends one email, not four.

## If the server has no mail

A self-hosted server may have no email set up at all. Then the email controls **do not appear**:
the settings page asks the server whether it can send mail, and hides the option when it cannot.
Password-reset links, in the same situation, are written to the backend log for the host, and the
reset page tells the person to ask the host. A control that cannot work is worse than no control.

## Where it is decided

The stream monitor, which polls the media server every few seconds, notices the transition from
offline to live. It stores a notification for each follower with the bell on, pushes it to anyone
connected right now, and sends the opted-in emails. A viewer who is offline finds the bell waiting
when they return.

## Tested the boring way

The notification tests check the dull promises: going live rings the bell for followers only,
turning the bell off for one channel silences just that channel, the live email is opt-in and sent
at most once an hour, the email controls are unavailable without mail, and nobody can mark
someone else's notifications read.
