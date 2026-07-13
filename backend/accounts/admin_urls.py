from django.urls import path

from .admin_views import (
    AdminLoginView,
    AdminStatsView,
    AdminUserDeleteView,
    AdminUserListView,
)

urlpatterns = [
    path("login/", AdminLoginView.as_view(), name="admin-login"),
    path("stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("users/", AdminUserListView.as_view(), name="admin-users"),
    path("users/<uuid:user_id>/", AdminUserDeleteView.as_view(), name="admin-user-delete"),
]
