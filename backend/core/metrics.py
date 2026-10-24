"""Prometheus metrics: request rate and latency, open sockets, chat volume, live channels."""

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest

HTTP_REQUESTS = Counter(
    "adda_http_requests_total", "HTTP requests handled", ["method", "route", "status"]
)
HTTP_LATENCY = Histogram(
    "adda_http_request_duration_seconds",
    "HTTP request duration",
    ["method", "route"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5),
)
WS_CONNECTIONS = Gauge("adda_ws_connections", "Open WebSocket connections on this instance")
WS_GUESTS = Gauge("adda_ws_guest_connections", "Of those, read-only guest connections")
CHAT_MESSAGES = Counter("adda_chat_messages_total", "Chat messages accepted")
CHAT_REJECTED = Counter("adda_chat_rejected_total", "Chat messages refused", ["reason"])
LIVE_CHANNELS = Gauge("adda_live_channels", "Channels currently live")


def render() -> tuple[bytes, str]:
    """The exposition body and its content type."""
    return generate_latest(), CONTENT_TYPE_LATEST
