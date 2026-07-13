from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

User = get_user_model()


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
