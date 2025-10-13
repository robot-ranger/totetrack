import os
import re
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def _bool_env(name: str, default: bool = False) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


def _html_to_text(html: str) -> str:
    # Very basic fallback: strip tags and collapse spaces
    text = re.sub(r"<br\s*/?>", "\n", html, flags=re.I)
    text = re.sub(r"</p\s*>", "\n\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"[ \t]+", " ", text).strip()


def send_email(subject: str, to_email: str, html_body: str, text_body: str | None = None) -> bool:
    """
    Send an email using environment-configured SMTP.

    Env vars:
      - SMTP_HOST (required)
      - SMTP_PORT (default 587)
      - SMTP_USERNAME (optional)
      - SMTP_PASSWORD (optional)
      - SMTP_FROM_EMAIL (default 'no-reply@localhost')
      - SMTP_USE_TLS (default 'true')
      - SMTP_USE_SSL (default 'false')
    """
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME") or ""
    password = os.getenv("SMTP_PASSWORD") or ""
    from_email = os.getenv("SMTP_FROM_EMAIL", "no-reply@localhost")
    use_tls = _bool_env("SMTP_USE_TLS", True)
    use_ssl = _bool_env("SMTP_USE_SSL", False)

    if not host:
        # Dev-friendly: log and no-op if SMTP not configured
        print("[email] SMTP_HOST not set, skipping send. Subject:", subject, "To:", to_email)
        return False

    if not text_body:
        text_body = _html_to_text(html_body)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        if use_ssl:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, context=context) as server:
                if username:
                    server.login(username, password)
                server.sendmail(from_email, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(host, port) as server:
                server.ehlo()
                if use_tls:
                    context = ssl.create_default_context()
                    server.starttls(context=context)
                    server.ehlo()
                if username:
                    server.login(username, password)
                server.sendmail(from_email, [to_email], msg.as_string())
        print(f"[email] Sent to {to_email}: {subject}")
        return True
    except Exception as e:
        print(f"[email] Failed to send to {to_email}: {e}")
        return False
