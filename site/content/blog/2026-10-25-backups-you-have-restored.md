---
title: "Backups you have restored"
description: "A backup you have never restored is a hope. How adda's scripts work, and the dry run that proves them."
date: 2026-10-25
order: 9
tag: "Operations"
image: "/blog/backups-you-have-restored.svg"
---

Everything that matters in an adda install is in three places: the Postgres database, the
`uploads/` folder, and the `recordings/` folder. Two scripts cover them, and one of the two exists
mostly to prove the other works.

## The backup

`scripts/backup.sh` writes one timestamped folder holding:

- `db.sql.gz`, a compressed `pg_dump` of the database;
- `uploads.tar.gz`, emotes, banners, profile pictures and uploaded videos;
- `recordings.tar.gz`, the recorded broadcasts.

Recordings are big, so `SKIP_RECORDINGS=1` leaves them out and you copy that folder yourself.
Redis is not backed up, on purpose: it holds rate-limit windows, presence and poll tallies that
rebuild from Postgres, so losing it costs nothing that matters.

## The restore

`scripts/restore.sh <folder>` puts the three back. It **replaces** the database, uploads and
recordings, so the script says so at the top and expects you to stop the app first.

## The dry run

The part that earns trust is a switch: `TARGET_DB`. Set it and the restore goes into a _scratch
database_ instead of the live one, dropping and recreating it first. You can restore last night's
backup next to the running site, look at it, and throw it away.

The restore was verified this way against a seeded database: back up, restore into a scratch
database, and compare what came out. A backup you have never restored is a hope; one you have
restored into a scratch database is a fact.

## Upgrades are the other reason

Database migrations run when the backend container starts, and one older migration cannot be
downgraded. So the upgrade notes say it plainly: take a backup first. That is the same script,
used before every change rather than after every disaster.

## What to do with the files

The folder is the unit. Copy it off the machine, to another disk or another provider; a backup on
the server it protects is not a backup. adda does not schedule the script for you, because where
the copies go is your decision. A cron line and a place to put the folder is the whole job.
