#!/bin/sh
# ─────────────────────────────────────────────────────────────────────
# adda — one-command installer for non-technical users.
#
#   curl -fsSL https://raw.githubusercontent.com/shahadathhs/adda/adda-v3/scripts/install.sh | sh
#
# Run it on a fresh server as root (or with sudo). It:
#   1. asks for your domain and admin email
#   2. installs Docker + Compose if missing
#   3. downloads the adda source (no git needed)
#   4. waits until your domain's DNS points here
#   5. generates every secret, writes .env
#   6. starts the stack with automatic HTTPS
#   7. prints your admin password exactly once
# ─────────────────────────────────────────────────────────────────────
set -eu

REPO_URL="${ADDA_REPO:-https://github.com/shahadathhs/adda}"
REPO_BRANCH="${ADDA_BRANCH:-adda-v3}"
INSTALL_DIR="${ADDA_DIR:-/opt/adda}"

say()  { printf '\033[1;33madda\033[0m %s\n' "$1"; }
warn() { printf '\033[1;31madda:\033[0m %s\n' "$1" >&2; }
die()  { warn "error: $1"; exit 1; }

# When piped (curl | sh), stdin is the script — re-exec from a real file
# so interactive prompts work.
if [ ! -t 0 ]; then
    TMP="$(mktemp)"
    cat >"$TMP"
    exec sh "$TMP"
fi

# ── privilege check ──────────────────────────────────────────────────
SUDO=""
if [ "$(id -u)" -ne 0 ]; then
    command -v sudo >/dev/null 2>&1 || die "run as root, or install sudo first"
    SUDO="sudo"
    say "Not root — using sudo for system steps."
fi

# ── basics ───────────────────────────────────────────────────────────
command -v curl >/dev/null 2>&1 || die "curl is required (apt install curl)"
if ! command -v openssl >/dev/null 2>&1; then
    $SUDO apt-get update -qq
    $SUDO apt-get install -y -qq openssl >/dev/null
fi

# ── 1. answers ───────────────────────────────────────────────────────
ADDA_DOMAIN="${ADDA_DOMAIN:-}"
SUPERADMIN_EMAIL="${SUPERADMIN_EMAIL:-}"

if [ -z "$ADDA_DOMAIN" ]; then
    printf 'Domain your adda will live on (e.g. adda.example.com): '
    read -r ADDA_DOMAIN
fi
[ -n "$ADDA_DOMAIN" ] || die "a domain is required"
case "$ADDA_DOMAIN" in
localhost | 127.0.0.1)
    die "use a real domain — this installer is for public servers"
    ;;
esac

if [ -z "$SUPERADMIN_EMAIL" ]; then
    printf 'Admin email (your login) [%s]: ' "admin@$ADDA_DOMAIN"
    read -r SUPERADMIN_EMAIL
    SUPERADMIN_EMAIL="${SUPERADMIN_EMAIL:-admin@$ADDA_DOMAIN}"
fi

# ── 2. docker (installed for you if missing) ─────────────────────────
if ! command -v docker >/dev/null 2>&1; then
    if [ -z "${NONINTERACTIVE:-}" ]; then
        printf 'Docker is not installed — install it for me? [Y/n]: '
        read -r install_docker
        case "$install_docker" in n | N) die "cannot continue without docker" ;; esac
    fi
    say "Installing Docker (official get.docker.com script)…"
    curl -fsSL https://get.docker.com | sh >/dev/null 2>&1 \
        || die "Docker install failed — install it manually and rerun"
fi
docker compose version >/dev/null 2>&1 \
    || die "Docker Compose v2 missing — update Docker and rerun"
$SUDO docker info >/dev/null 2>&1 || warn "docker needs a moment to start; continuing"

# ── 3. source code (downloaded for you if needed) ────────────────────
if [ -f "$INSTALL_DIR/compose.yaml" ] || [ -f "$(pwd)/compose.yaml" ]; then
    case "$(pwd)" in
        "$INSTALL_DIR") REPO_DIR="$INSTALL_DIR" ;;
        *) REPO_DIR="$(pwd)" ;;
    esac
    [ -f "$REPO_DIR/compose.yaml" ] || REPO_DIR="$INSTALL_DIR"
    say "Using existing source at $REPO_DIR"
else
    REPO_DIR="$INSTALL_DIR"
    say "Downloading adda ($REPO_BRANCH) to $REPO_DIR…"
    $SUDO mkdir -p "$REPO_DIR"
    curl -fsSL "$REPO_URL/archive/refs/heads/$REPO_BRANCH.tar.gz" \
        | $SUDO tar -xz --strip-components=1 -C "$REPO_DIR" \
        || die "source download failed — check your internet connection"
fi
cd "$REPO_DIR"

# ── 4. DNS (we wait with you) ────────────────────────────────────────
SERVER_IP="$(curl -fsS4 --max-time 5 https://api.ipify.org || true)"
say ""
say "Your adda will live at:  https://$ADDA_DOMAIN"
[ -n "$SERVER_IP" ] && say "This server's IP:        $SERVER_IP"
say ""
say "Make sure an DNS 'A' record points $ADDA_DOMAIN at this server"
[ -n "$SERVER_IP" ] && say "(your registrar's DNS dashboard → add record → A → $SERVER_IP)"
say ""

if [ -z "${SKIP_DNS_WAIT:-}" ]; then
    say "Waiting for DNS to propagate (this can take a few minutes)…"
    i=0
    resolved=""
    while [ $i -lt 60 ]; do
        resolved="$(getent hosts "$ADDA_DOMAIN" 2>/dev/null | awk '{print $1; exit}' || true)"
        if [ -n "$resolved" ]; then
            if [ -n "$SERVER_IP" ] && [ "$resolved" != "$SERVER_IP" ]; then
                warn "$ADDA_DOMAIN resolves to $resolved, but this server is $SERVER_IP"
                warn "Point the A record at $SERVER_IP, or continue if you know better."
                [ -z "${NONINTERACTIVE:-}" ] && { printf 'Continue anyway? [y/N]: '; read -r go; }
                case "${go:-y}" in n | N) exit 1 ;; esac
            fi
            break
        fi
        i=$((i + 1))
        printf '.'
        sleep 10
    done
    echo
    [ -n "$resolved" ] || die "DNS never resolved — add the A record, then rerun with SKIP_DNS_WAIT=1"
    say "DNS is live: $ADDA_DOMAIN → $resolved"
fi

# ── 5. secrets + .env ────────────────────────────────────────────────
ENV_FILE="$REPO_DIR/.env"
if [ -f "$ENV_FILE" ] && [ "${FORCE:-}" != "1" ]; then
    die "$ENV_FILE already exists — rerun with FORCE=1 to regenerate it"
fi

gen_hex()  { openssl rand -hex "$1"; }
gen_pass() { openssl rand -base64 18 | tr '+/' '-_' | tr -d '\n='; }

POSTGRES_PASSWORD="$(gen_hex 16)"
JWT_SECRET="$(gen_hex 48)"
SUPERADMIN_PASSWORD="$(gen_pass)"

$SUDO tee "$ENV_FILE" >/dev/null <<EOF
# Generated by install.sh on $(date -u +%Y-%m-%dT%H:%MZ) — safe to edit, then restart.
ADDA_DOMAIN=$ADDA_DOMAIN

POSTGRES_USER=adda
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=adda

JWT_SECRET=$JWT_SECRET
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

SUPERADMIN_USERNAME=admin
SUPERADMIN_EMAIL=$SUPERADMIN_EMAIL
SUPERADMIN_PASSWORD=$SUPERADMIN_PASSWORD
SEED_TEST_USERS=false

CORS_ORIGINS=https://$ADDA_DOMAIN
HLS_BASE_URL=https://$ADDA_DOMAIN/hls
NEXT_PUBLIC_API_BASE_URL=https://$ADDA_DOMAIN
NEXT_PUBLIC_HLS_BASE_URL=https://$ADDA_DOMAIN/hls
PASSWORD_RESET_URL=https://$ADDA_DOMAIN/reset-password

SMTP_HOST=${SMTP_HOST:-}
SMTP_PORT=${SMTP_PORT:-587}
SMTP_USERNAME=${SMTP_USERNAME:-}
SMTP_PASSWORD=${SMTP_PASSWORD:-}
SMTP_FROM=adda <noreply@$ADDA_DOMAIN>
SMTP_STARTTLS=true
EOF
$SUDO chmod 600 "$ENV_FILE"

# ── 6. build & start ─────────────────────────────────────────────────
say "Building and starting everything (first run takes a few minutes)…"
$SUDO docker compose --profile prod up -d --build

say "Waiting for the backend to become healthy…"
i=0
health=""
while [ $i -lt 60 ]; do
    health="$($SUDO docker compose ps --format '{{.Health}}' backend 2>/dev/null || true)"
    [ "$health" = "healthy" ] && break
    i=$((i + 1))
    sleep 5
done
[ "$health" = "healthy" ] || die "backend did not become healthy — check: $SUDO docker compose logs backend"

# ── 7. done ──────────────────────────────────────────────────────────
say "──────────────────────────────────────────────────"
say ""
say "  adda is live:   https://$ADDA_DOMAIN"
say ""
say "  admin login:    $SUPERADMIN_EMAIL"
say "  password:       $SUPERADMIN_PASSWORD"
say ""
say "  Change the password after first sign-in (Settings)."
say "  It is stored only in .env — shown this one time only."
say ""
say "  OBS stream URL: rtmp://$ADDA_DOMAIN/live"
say "  (stream key: create a channel, then channel settings)"
say ""
say "  To update later:  cd $REPO_DIR && $SUDO docker compose --profile prod up -d --build"
say "──────────────────────────────────────────────────"
