---
title: "Search and pagination at self-hosted scale"
description: "Why the directories filter in memory, what that costs, and the rules that keep every view shareable."
date: 2026-10-25
order: 6
tag: "Engineering"
image: "/blog/search-and-pagination-at-self-hosted-scale.svg"
---

adda has one search box and four directories (Live, Channels, Videos, Recordings). They look like
a standard list-with-filters problem. The interesting part is what _not_ to build.

## The honest shape of the data

A self-hosted instance has tens or hundreds of channels, not millions. And the facts people filter
and sort by (is it live, how many are watching) do not live in the database: live state comes from
the media server and viewer counts from Redis.

So the channel directory does one query for the channels that match the text, attaches live state
and follower counts, and then filters, sorts and slices **in memory**. A database index cannot help
sort by a number it does not have. At this scale it is fast, and it is simple enough to read in one
go. If an instance ever outgrows it, the place to change is one function.

## What every directory gives you

- A text filter, a sort order, and a page of up to 48 items (12 on screen).
- For channels, a live or offline filter; for videos and recordings, a channel filter.
- A total, so the page can say "1–12 of 91" and draw the page numbers.

Private and suspended channels never appear, anywhere, including search suggestions.

## Everything lives in the address

The filter text, the status, the sort and the page number are all in the URL. That gives you
bookmarking and sharing for free, a working back button, and pagination that is made of ordinary
links. Changing a filter resets the page to the first, so you never land on page nine of a list
that now has two.

## The search box

One component serves the top bar and the home page. As you type it asks for a few channels, videos
and recordings, live channels first, and shows them with the matched text emphasised. It follows
the combobox pattern: arrow keys move, Enter opens, Escape closes, and a screen reader hears the
highlighted option. Loading, no-result and error each have a line of text, so it never just goes
quiet.

## Honesty about limits

Search is substring matching, not ranking. It does not correct typos. For a site with a few hundred
channels that is the right amount of machine.
