import json
import re
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.utils import timezone

from .models import LoginOTP, User

OTP_EXPIRY_MINUTES = 10
MAX_OTP_ATTEMPTS = 5


class EmailDeliveryError(Exception):
    """Raised when OTP email cannot be delivered."""


def _format_email_delivery_error(exc: Exception) -> str:
    message = str(exc)

    if "error code: 1010" in message or "error 1010" in message.lower():
        return "Email service blocked the request (missing client headers). This has been fixed — redeploy the backend."

    if "only send testing emails to your own email address" in message:
        match = re.search(r"your own email address \(([^)]+)\)", message)
        allowed = match.group(1) if match else "your Resend account email"
        return (
            f"Resend test mode only allows sending to {allowed}. "
            f"Sign up with that email, or verify a domain at resend.com/domains."
        )

    if "Invalid `from` field" in message:
        return (
            "Email sender is misconfigured. On Render set "
            "DEFAULT_FROM_EMAIL to: TaskFlow <onboarding@resend.dev>"
        )

    if "Resend API error 401" in message or "invalid_api_key" in message.lower():
        return "Resend API key is invalid. Update RESEND_API_KEY on Render."

    if "Resend API error" in message:
        json_start = message.find("{")
        if json_start != -1:
            try:
                payload = json.loads(message[json_start:])
                resend_message = payload.get("message") or payload.get("error")
                if isinstance(resend_message, str) and resend_message.strip():
                    return resend_message
            except json.JSONDecodeError:
                pass

    return "Could not send verification email. Please try again later or contact support."


def generate_otp_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def send_otp_email(user: User, code: str, purpose: str = "login") -> None:
    if purpose == "signup":
        subject = "Verify your TaskFlow email"
        intro = "Use this code to verify your email and activate your account:"
    else:
        subject = "Your TaskFlow sign-in code"
        intro = "Your TaskFlow sign-in verification code is:"

    message = (
        f"Hi,\n\n"
        f"{intro} {code}\n\n"
        f"This code expires in {OTP_EXPIRY_MINUTES} minutes.\n"
        f"If you did not request this, you can ignore this email.\n"
    )
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
    except Exception as exc:
        raise EmailDeliveryError(_format_email_delivery_error(exc)) from exc


def create_login_otp(user: User, purpose: str = "login") -> LoginOTP:
    LoginOTP.objects.filter(user=user).delete()
    code = generate_otp_code()
    otp = LoginOTP.objects.create(
        user=user,
        code_hash=make_password(code),
        expires_at=timezone.now() + timedelta(minutes=OTP_EXPIRY_MINUTES),
    )
    send_otp_email(user, code, purpose=purpose)
    return otp


def verify_login_otp(challenge_token: str, code: str) -> User | None:
    try:
        otp = LoginOTP.objects.select_related("user").get(challenge_token=challenge_token)
    except LoginOTP.DoesNotExist:
        return None

    if otp.expires_at < timezone.now():
        otp.delete()
        return None

    if otp.attempts >= MAX_OTP_ATTEMPTS:
        otp.delete()
        return None

    otp.attempts += 1
    otp.save(update_fields=["attempts"])

    if not check_password(code, otp.code_hash):
        if otp.attempts >= MAX_OTP_ATTEMPTS:
            otp.delete()
        return None

    user = otp.user
    otp.delete()
    return user


def resend_login_otp(challenge_token: str) -> bool:
    try:
        otp = LoginOTP.objects.select_related("user").get(challenge_token=challenge_token)
    except LoginOTP.DoesNotExist:
        return False

    if otp.expires_at < timezone.now():
        otp.delete()
        return False

    code = generate_otp_code()
    otp.code_hash = make_password(code)
    otp.attempts = 0
    otp.save(update_fields=["code_hash", "attempts"])
    purpose = "signup" if not otp.user.is_active else "login"
    send_otp_email(otp.user, code, purpose=purpose)
    return True
