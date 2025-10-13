from datetime import datetime


def _base_email_html(title: str, body_html: str) -> str:
    return f"""
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta charSet="utf-8" />
    <title>{title}</title>
  </head>
  <body style="margin:0;background:#f6f8fb;">
    <table role="presentation" width="100%" style="background:#f6f8fb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e9edf5;">
            <tr>
              <td style="padding:24px 24px 8px 24px;background:#111827;color:#fff;">
                <h1 style="margin:0;font-size:20px;font-weight:700;">ToteTrack</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:#111827;font-family:system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
                {body_html}
                <p style="color:#6b7280;font-size:12px;margin-top:24px;">
                  If you didn’t request this, you can safely ignore this email.
                </p>
                <p style="color:#9ca3af;font-size:12px;">{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</p>
              </td>
            </tr>
            <tr>
              <td style="height:16px;background:#ffffff;"></td>
            </tr>
          </table>
          <p style="color:#9ca3af;font-size:12px;margin:12px 0 0;">© {datetime.utcnow().year} ToteTrack</p>
        </td>
      </tr>
    </table>
  </body>
</html>
""".strip()


def _button(label: str, href: str) -> str:
    return f"""
<a href="{href}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">
  {label}
</a>
""".strip()


def welcome_email_html(full_name: str | None, verify_url: str) -> str:
    name = full_name or "there"
    body = f"""
<p style="margin:0 0 12px;">Hi {name},</p>
<p style="margin:0 0 16px;">Welcome to ToteTrack! Please verify your email to activate your account.</p>
<p style="margin:16px 0;">{_button("Verify my email", verify_url)}</p>
<p style="margin:16px 0 0;color:#6b7280;">Or copy and paste this link into your browser:<br/>
  <a href="{verify_url}" style="color:#2563eb;">{verify_url}</a>
</p>
""".strip()
    return _base_email_html("Verify your email", body)


def password_recovery_email_html(full_name: str | None, reset_url: str) -> str:
    name = full_name or "there"
    body = f"""
<p style="margin:0 0 12px;">Hi {name},</p>
<p style="margin:0 0 16px;">We received a request to reset your ToteTrack password. Click the button below to set a new password.</p>
<p style="margin:16px 0;">{_button("Reset my password", reset_url)}</p>
<p style="margin:16px 0 0;color:#6b7280;">If you didn't request a password reset, you can ignore this email.</p>
<p style="margin:16px 0 0;color:#6b7280;">Or copy and paste this link:<br/>
  <a href="{reset_url}" style="color:#2563eb;">{reset_url}</a>
</p>
""".strip()
    return _base_email_html("Reset your password", body)
