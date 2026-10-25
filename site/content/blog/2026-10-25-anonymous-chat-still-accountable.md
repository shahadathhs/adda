---
title: "Anonymous chat that is still accountable"
description: "An account can chat as Anonymous. Viewers never learn who, the moderators can, and every lookup is logged."
date: 2026-10-25
order: 5
tag: "Chat"
image: "/blog/anonymous-chat-still-accountable.svg"
---

Some people will only ask a question if their name is not attached. A channel that wants moderation
needs to know who said what. adda gives both, by being exact about who sees what.

## Two modes, one account

Every chat message is written by an account. In **Settings** an account chooses to appear under its
name or as "Anonymous". Anonymous is a display choice for _viewers_. The database row still carries
the account, always.

## The server strips it, not the page

The anonymous author is removed on the server, before the message is sent to anyone. A viewer's
browser never receives the name, the username or the id, so there is nothing to find in the network
tab and nothing a clever client can unhide. This is the point where it would be easy to cheat by
hiding the name in the interface and sending it anyway; adda does not.

## Who can look behind it

The channel owner, the channel's moderators and the server admin can reveal the account behind an
anonymous message. That is what makes moderation possible: a person cannot post abuse and be
untouchable just because they chose a mask.

Every reveal is **logged**, with who looked and when, in the same moderation log as deletes,
timeouts and bans. A moderator who browses identities out of curiosity leaves a trail the owner can
read.

## Rules that do not change

Anonymous accounts follow every chat rule: bans and timeouts apply to the account, so changing the
mask does not escape one, and rate limits and slow mode count per account. An anonymous account
also cannot be mentioned by name, so an @mention cannot be used to unmask one, and a reply to an
anonymous message does not expose its author.

## Said plainly in the product

The settings page says what Anonymous does and does not do, with a preview of both modes: your name
is hidden from other viewers; your messages are still recorded against your account; the channel
owner, its moderators and the server admin can see who is behind them. A feature that promises more
than it delivers is worse than not having it.
