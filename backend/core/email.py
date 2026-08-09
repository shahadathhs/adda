"""Async SMTP email sender. No-ops when SMTP isn't configured (e.g. local dev)."""

import logging
from email.message import EmailMessage

import aiosmtplib

from core.config import settings

logger = logging.getLogger("adda.email")


async def send_email(to: str, subject: str, html: str, text: str) -> None:
    """Send a transactional email. Silently skips when smtp_host is empty."""
    if not settings.smtp_host:
        logger.info("SMTP not configured — skipping email to %s (%s)", to, subject)
        return

    msg = EmailMessage()
    msg["From"] = settings.smtp_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_username or None,
            password=settings.smtp_password or None,
            start_tls=settings.smtp_starttls,
        )
    except Exception:
        logger.exception("Failed to send email to %s", to)


async def send_password_reset_email(to: str, reset_link: str) -> None:
    subject = "Reset your adda password"
    text = (
        "We received a request to reset your adda password.\n\n"
        f"Reset it here (valid for {settings.reset_token_expire_minutes} minutes):\n"
        f"{reset_link}\n\n"
        "If you didn't make this request, you can safely ignore this email."
    )
    html = f"""\
<div style="font-family:sans-serif;line-height:1.6;max-width:560px;margin:auto">
  <h2 style="color:#7c3aed">Reset your adda password</h2>
  <p>We received a request to reset your password. Click the button below to choose a new one.
     The link expires in {settings.reset_token_expire_minutes} minutes.</p>
  <p style="margin:24px 0">
    <a href="{reset_link}" style="display:inline-block;background:#7c3aed;color:#fff;
       padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">
       Reset password</a>
  </p>
  <p style="color:#6b7280;font-size:14px">
     If the button doesn't work, copy this link: {reset_link}</p>
  <p style="color:#6b7280;font-size:14px">
     If you didn't request this, you can safely ignore this email.</p>
</div>"""
    await send_email(to, subject, html, text)
