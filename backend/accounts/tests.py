from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

User = get_user_model()


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="test@taskflow.local",
)
class RegisterViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_creates_user_and_returns_tokens(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "email": "newuser@example.com",
                "password": "SecurePass123!",
                "password_confirm": "SecurePass123!",
                "first_name": "New",
                "last_name": "User",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(email="newuser@example.com").exists())
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "newuser@example.com")

    def test_register_rejects_duplicate_email(self):
        User.objects.create_user(email="taken@example.com", password="SecurePass123!")

        response = self.client.post(
            "/api/auth/register/",
            {
                "email": "taken@example.com",
                "password": "SecurePass123!",
                "password_confirm": "SecurePass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

    def test_tasks_are_scoped_to_registered_user(self):
        register_response = self.client.post(
            "/api/auth/register/",
            {
                "email": "scoped@example.com",
                "password": "SecurePass123!",
                "password_confirm": "SecurePass123!",
            },
            format="json",
        )
        token = register_response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        tasks_response = self.client.get("/api/tasks/", {"date": "2026-07-13"})
        self.assertEqual(tasks_response.status_code, 200)
        self.assertEqual(tasks_response.data["count"], 0)

        images_response = self.client.get("/api/annotations/images/")
        self.assertEqual(images_response.status_code, 200)
        self.assertEqual(images_response.data["count"], 0)


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="test@taskflow.local",
)
class LoginOTPTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="login@example.com", password="SecurePass123!")

    @patch("accounts.otp.generate_otp_code", return_value="123456")
    def test_login_sends_otp_and_requires_verification(self, _mock_code):
        response = self.client.post(
            "/api/auth/login/",
            {"email": "login@example.com", "password": "SecurePass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["requires_otp"])
        self.assertIn("challenge_token", response.data)
        self.assertEqual(response.data["email"], "login@example.com")
        self.assertNotIn("access", response.data)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("123456", mail.outbox[0].body)

    @patch("accounts.otp.generate_otp_code", return_value="123456")
    def test_verify_otp_returns_tokens(self, _mock_code):
        login_response = self.client.post(
            "/api/auth/login/",
            {"email": "login@example.com", "password": "SecurePass123!"},
            format="json",
        )

        verify_response = self.client.post(
            "/api/auth/verify-otp/",
            {
                "challenge_token": login_response.data["challenge_token"],
                "otp": "123456",
            },
            format="json",
        )

        self.assertEqual(verify_response.status_code, 200)
        self.assertIn("access", verify_response.data)
        self.assertIn("refresh", verify_response.data)

    @patch("accounts.otp.generate_otp_code", return_value="123456")
    def test_verify_otp_rejects_wrong_code(self, _mock_code):
        login_response = self.client.post(
            "/api/auth/login/",
            {"email": "login@example.com", "password": "SecurePass123!"},
            format="json",
        )

        verify_response = self.client.post(
            "/api/auth/verify-otp/",
            {
                "challenge_token": login_response.data["challenge_token"],
                "otp": "000000",
            },
            format="json",
        )

        self.assertEqual(verify_response.status_code, 400)

    def test_login_rejects_invalid_credentials(self):
        response = self.client.post(
            "/api/auth/login/",
            {"email": "login@example.com", "password": "WrongPassword!"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)
