---
title: "Six chat rules, in a fixed order"
description: "Bans, followers-only, slow mode, rate limits, length and duplicates: the order matters more than it looks."
date: 2026-10-25
order: 8
tag: "Chat"
image: "/blog/six-chat-rules-in-a-fixed-order.svg"
---

When someone presses Enter in chat, a handful of rules decide what happens. adda runs them in one
fixed order, and the order is part of the design.

## The order

1. **Banned or timed out?** The strongest answer first. A banned account is told it is banned, not
   that it is typing too fast.
2. **Followers-only?** If the channel requires it and the sender does not follow, stop.
3. **Slow mode?** If the sender spoke too recently, say how many seconds remain.
4. **Rate limit.** A burst of five messages in five seconds, then about one a second.
5. **Length.** At most 300 characters.
6. **Duplicate.** The same text from the same account in the same channel within ten seconds is
   dropped.

## Why this order

Each rule gives the sender a specific answer, so the most specific and most permanent reasons come
first: "you are banned" beats "you are on slow mode". The cheap, per-message checks come last, after
the ones that depend on who the sender is. That also keeps the Redis work down: a banned account
never reaches the rate-limit counter.

## Who is exempt

The channel owner, its moderators and platform staff skip followers-only, slow mode and the rate
limit. The people running the room should not be locked out of it by the tools they use to run it.
Length and duplicate detection still apply to everyone.

## Where the limits live

Slow mode, rate limits and duplicate detection are small keys in Redis with a time to live, so
they expire by themselves and cost nothing to keep. Bans, timeouts and the settings that turn
followers-only and slow mode on are in Postgres, because they are decisions someone made and they
belong in the audit log.

## Reactions have rules too

Reactions come from an allow-list of eight emoji, with at most five different reactions on one
message, and they are batched at a quarter of a second so a busy room does not melt the clients.

## Each rule has a test

The chat test suite has a case per rule: the sixth message in a burst is rate limited, an identical
message within ten seconds is dropped, a timeout blocks chat and then expires, a ban lasts until it
is lifted and the person is told, slow mode limits viewers but not the owner, and who may ban whom
is checked. A change to the rules has to get past them.
