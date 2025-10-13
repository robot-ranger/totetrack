from typing import Optional


def welcome_email_html(full_name: Optional[str], verification_url: str) -> str:
    name = full_name or "there"
    # Simple, clean HTML email compatible with most clients
    return f"""
<!doctype html>
<html>
  <head>
    <meta name=viewport content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Welcome to ToteTrack</title>
    <style>
      body {{ background-color:#f7fafc; margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif; color:#1a202c; }}
      .container {{ max-width:600px; margin:0 auto; padding:24px; }}
      .card {{ background:#ffffff; border-radius:8px; padding:24px; box-shadow:0 1px 3px rgba(0,0,0,0.08); }}
      .btn {{ display:inline-block; background:#3182ce; color:#fff !important; padding:12px 20px; border-radius:6px; text-decoration:none; font-weight:600; }}
      .muted {{ color:#718096; font-size:14px; }}
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <h1 style="margin-top:0;">Welcome to ToteTrack, {name} 👋</h1>
        <p>We're excited to have you on board. To finish setting up your account, please verify your email address.</p>
        <p style="margin:24px 0;">
          <a class="btn" href="{verification_url}" target="_blank" rel="noreferrer">Verify my email</a>
        </p>
        <p class="muted">If the button doesn't work, copy and paste this link into your browser:</p>
        <p class="muted" style="word-break:break-all;">{verification_url}</p>
        <hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0;" />
        <p class="muted">If you didn't expect this email, you can safely ignore it.</p>
      </div>
    </div>
  </body>
</html>
"""
