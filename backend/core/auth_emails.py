"""Email templates for auth-related notifications."""

from core.config import settings


async def send_otp_login_email(to: str, code: str) -> None:
    from core.email import send_email

    await send_email(
        to,
        "Your adda login code",
        f"Your login code is: {code}\nIt expires in {settings.reset_token_expire_minutes} minutes.",
        f"""\
<div style="font-family:sans-serif;line-height:1.6;max-width:480px;margin:auto">
  <h2 style="color:#7c3aed">Sign in to adda</h2>
  <p>Use this code to complete your sign-in:</p>
  <p style="font-size:32px;font-weight:800;letter-spacing:6px;color:#7c3aed;
            background:#faf5ff;padding:16px;text-align:center;border-radius:8px">
    {code}</p>
  <p style="color:#6b7280;font-size:14px">
    This code expires in 5 minutes. If you didn't request it, ignore this email.</p>
</div>""",
    )


async def send_2fa_code_email(to: str, code: str) -> None:
    from core.email import send_email

    await send_email(
        to,
        "Your adda verification code",
        f"Your verification code is: {code}\nIt expires in 5 minutes.",
        f"""\
<div style="font-family:sans-serif;line-height:1.6;max-width:480px;margin:auto">
  <h2 style="color:#7c3aed">Two-factor verification</h2>
  <p>Enter this code to complete your sign-in:</p>
  <p style="font-size:32px;font-weight:800;letter-spacing:6px;color:#7c3aed;
            background:#faf5ff;padding:16px;text-align:center;border-radius:8px">
    {code}</p>
  <p style="color:#6b7280;font-size:14px">
    This code expires in 5 minutes. If you didn't request it, ignore this email.</p>
</div>""",
    )


async def send_2fa_setup_email(to: str, code: str) -> None:
    from core.email import send_email

    await send_email(
        to,
        "Confirm two-factor authentication",
        f"Enter this code to enable 2FA on your account: {code}",
        f"""\
<div style="font-family:sans-serif;line-height:1.6;max-width:480px;margin:auto">
  <h2 style="color:#7c3aed">Enable two-factor authentication</h2>
  <p>Enter this code to confirm and enable 2FA:</p>
  <p style="font-size:32px;font-weight:800;letter-spacing:6px;color:#7c3aed;
            background:#faf5ff;padding:16px;text-align:center;border-radius:8px">
    {code}</p>
  <p style="color:#6b7280;font-size:14px">
    This code expires in 5 minutes. If you didn't request this, ignore this email.</p>
</div>""",
    )


async def send_google_linked_email(to: str) -> None:
    from core.email import send_email

    await send_email(
        to,
        "Google account linked to your adda account",
        "Your adda account was just linked to a Google account. You can now sign in with either method.",
        f"""\
<div style="font-family:sans-serif;line-height:1.6;max-width:560px;margin:auto">
  <h2 style="color:#7c3aed">Google account linked</h2>
  <p>Your adda account ({to}) was just linked to a Google account.</p>
  <p>You can now sign in with either your password or "Sign in with Google".</p>
  <p style="color:#6b7280;font-size:14px">
    If you didn't do this, please change your password immediately.</p>
</div>""",
    )
