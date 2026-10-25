---
title: "Polls that survive a Redis restart"
description: "Live tallies in Redis for speed, votes in Postgres for truth, and a rebuild when the two disagree."
date: 2026-10-25
order: 7
tag: "Chat"
image: "/blog/polls-that-survive-a-redis-restart.svg"
---

A poll looks like a small feature: a question, a few options, a bar chart that moves. It is also a
good test of a rule that runs through adda: use Redis for speed, but never let it be the only place
a fact lives.

## The rules

- A channel has **one open poll** at a time.
- An account gets **one vote** per poll, enforced by a unique key in the database, not by the page.
- A poll has a duration. When it ends, the result is kept and shown.

## Two stores, two jobs

Every vote is written to Postgres. That is the record, and the unique constraint is what makes
"one vote each" true even when two requests race.

The counts that drive the moving bars live in Redis, because incrementing a counter is cheap and
reading it is cheaper. On each vote the server bumps the tally and publishes the new numbers; as
with reactions, bursts are batched so a flood of votes becomes one update.

## When Redis forgets

Restart Redis in the middle of a poll and the tallies are gone. The next time anything asks for the
poll, the server sees there is no tally and **rebuilds it from the votes in Postgres**. Nothing was
lost, because nothing important was only in memory. A test does exactly that: it clears the tallies
mid-poll and checks that the numbers come back right.

## Closing

A poll closes in two ways. Lazily: any read of an expired poll closes it first. And from the stream
monitor, which sweeps for polls that ran out while nobody was looking. Either path ends the same
way: the final counts are written down, the poll stops accepting votes, and the result stays on the
page for the people who arrive later.

## What a guest sees

Guests can watch a poll update and read the result. They cannot vote: the gateway answers
`auth_required` to their vote message, and the page shows "sign in to vote" instead of buttons.
