from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self):
        import logging

        from django.conf import settings

        logger = logging.getLogger(__name__)
        backend = settings.EMAIL_BACKEND
        if backend.endswith("console.EmailBackend") and not settings.DEBUG:
            logger.warning(
                "EMAIL_BACKEND is console — OTP emails are NOT sent to inboxes. "
                "Set RESEND_API_KEY or SMTP credentials on Render."
            )
