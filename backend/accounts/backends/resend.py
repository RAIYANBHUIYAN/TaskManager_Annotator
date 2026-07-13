import json
import logging
import urllib.error
import urllib.request

from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)

RESEND_USER_AGENT = "TaskFlow/1.0 (Django; +https://github.com/RAIYANBHUIYAN/TaskManager_Annotator)"


class ResendEmailBackend(BaseEmailBackend):
    """Send email via Resend HTTP API (https://resend.com)."""

    def send_messages(self, email_messages):
        api_key = getattr(settings, "RESEND_API_KEY", "")
        if not api_key:
            if not self.fail_silently:
                raise ValueError("RESEND_API_KEY is not configured")
            return 0

        sent = 0
        for message in email_messages:
            payload = {
                "from": message.from_email,
                "to": list(message.to),
                "subject": message.subject,
                "text": message.body,
            }
            request = urllib.request.Request(
                "https://api.resend.com/emails",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "User-Agent": RESEND_USER_AGENT,
                },
                method="POST",
            )
            try:
                with urllib.request.urlopen(request, timeout=30) as response:
                    if 200 <= response.status < 300:
                        sent += 1
            except urllib.error.HTTPError as exc:
                error_body = exc.read().decode("utf-8", errors="replace")
                logger.error("Resend API error %s: %s", exc.code, error_body)
                if not self.fail_silently:
                    raise RuntimeError(f"Resend API error {exc.code}: {error_body}") from exc
            except Exception:
                logger.exception("Failed to send email via Resend")
                if not self.fail_silently:
                    raise

        return sent
