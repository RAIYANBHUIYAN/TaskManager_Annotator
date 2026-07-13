from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.constants import ADMIN_EMAIL, ADMIN_USERNAME

User = get_user_model()


class AdminPanelTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email=ADMIN_EMAIL,
            password="admin@lex",
            is_staff=True,
            is_superuser=True,
        )
        self.regular = User.objects.create_user(
            email="user@example.com",
            password="SecurePass123!",
        )

    def test_admin_login_with_username(self):
        response = self.client.post(
            "/api/admin/login/",
            {"username": ADMIN_USERNAME, "password": "admin@lex"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)

    def test_admin_login_rejects_wrong_password(self):
        response = self.client.post(
            "/api/admin/login/",
            {"username": ADMIN_USERNAME, "password": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_admin_can_list_and_count_users(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_users"], 2)
        self.assertEqual(len(response.data["users"]), 2)

    def test_regular_user_cannot_access_admin_users(self):
        self.client.force_authenticate(user=self.regular)
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, 403)

    def test_admin_can_delete_regular_user(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/api/admin/users/{self.regular.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(id=self.regular.id).exists())

    def test_admin_cannot_delete_self(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/api/admin/users/{self.admin.id}/")
        self.assertEqual(response.status_code, 400)
