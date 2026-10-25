# adda — Operations

Running an adda server: install, configure, watch, back up, upgrade.

## Install

On a Linux server with a domain pointing at it and ports 80, 443 and 1935 open, as root:

```bash
curl -fsSL https://raw.githubusercontent.com/shahadathhs/adda/dev/scripts/install.sh | sh
```

It asks for the domain and an admin email, installs Docker if needed, generates every
secret, writes `/opt/adda/.env`, starts the stack with automatic HTTPS and prints the
admin password once. Migrations run on every backend start.

## Configuration

`.env` in the install directory. The ones people change:

| Variable                                                                                 | Meaning                                                                                                                                                    |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADDA_DOMAIN`                                                                            | The public domain                                                                                                                                          |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_STARTTLS` | Email for password-reset links and opt-in live alerts. Leave `SMTP_HOST` empty and email is simply off                                                     |
| `LOG_FORMAT`                                                                             | `json` (the default in compose) or `text`                                                                                                                  |
| `SUPERADMIN_*`                                                                           | The seeded admin account                                                                                                                                   |
| `NEXT_PUBLIC_SITE_URL`                                                                   | Optional: the marketing and docs site linked from the app footer and About page; defaults to `https://adda.vercel.app` (set before building the web image) |

The full list is in the reference docs (`site/content/docs/reference/configuration.md`).

## Health and metrics

| Endpoint       | Use                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| `GET /health`  | Liveness: the process answers                                                                                   |
| `GET /ready`   | Readiness: Postgres and Redis both answer (503 with the failing one otherwise). The compose healthcheck uses it |
| `GET /metrics` | Prometheus text. **Not published by Caddy**; scrape it on the backend port from inside the host                 |

Metrics: `adda_http_requests_total{method,route,status}` and
`adda_http_request_duration_seconds` (labelled by route pattern, never by raw URL),
`adda_ws_connections`, `adda_ws_guest_connections`, `adda_chat_messages_total`,
`adda_chat_rejected_total{reason}` and `adda_live_channels`.

Logs are one JSON object per line (`ts`, `level`, `logger`, `msg`, and for requests
`method`, `path`, `status`, `ms`). `docker compose logs -f backend`.

## Back up and restore

Everything that matters is in three places: the Postgres database, `uploads/` (emotes,
banners, profile pictures and uploaded videos) and `recordings/`.

```bash
scripts/backup.sh /srv/adda-backups          # db.sql.gz, uploads.tar.gz, recordings.tar.gz
SKIP_RECORDINGS=1 scripts/backup.sh          # leave the large folder to your own copy tool
```

Restore (this **replaces** the database, uploads and recordings):

```bash
docker compose stop backend web
scripts/restore.sh /srv/adda-backups/20261024T142421Z
docker compose up -d
```

To check a backup without touching the live data, restore only the database into a
scratch one: `TARGET_DB=adda_restore_test scripts/restore.sh <folder>`, compare the row
counts, then `DROP DATABASE adda_restore_test`. This was done on a seeded instance and
the user, channel, message, emote and poll counts matched.

## Upgrade

```bash
cd /opt/adda
git pull            # or re-run the installer, which keeps your .env
docker compose --profile prod up -d --build
```

The backend applies pending migrations when it starts. Take a backup first; migration
`d9a3f1c2b7e4` (chat by channel) cannot be downgraded.

## Things to know

- **Recordings and uploaded videos are not transcoded.** Quality is whatever the encoder or
  the uploader sends. Uploads are limited to 4 GB each and must be H.264, VP8, VP9 or AV1
  video, so they play directly in browsers. The backend image includes ffmpeg for
  inspecting them, fixing the MP4 index and taking a poster.
- **Uploaded videos live in `uploads/videos/`**, with one folder per video, so back up
  `uploads/` with the database. Uploads are sent in 8 MB parts; a reverse proxy in front
  of the API only needs to allow bodies of that size. Unfinished uploads are removed
  after 24 hours.
- **Playback is HLS**, a few seconds behind the encoder.
- **One backend instance is the tested default;** more work behind one Redis but
  deployment of that is not documented beyond this page.
- **Email is optional.** Without SMTP, reset links are written to the backend log.
