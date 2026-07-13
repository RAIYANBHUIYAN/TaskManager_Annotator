from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .constants import ADMIN_EMAIL, ADMIN_USERNAME
from .models import User
from .permissions import IsStaffUser
from .serializers import UserSerializer


class AdminLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class AdminLoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data["username"].strip()
        password = serializer.validated_data["password"]
        generic_error = {"detail": "Invalid admin credentials."}

        if username != ADMIN_USERNAME:
            return Response(generic_error, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=ADMIN_EMAIL, is_staff=True, is_active=True)
        except User.DoesNotExist:
            return Response(generic_error, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(password):
            return Response(generic_error, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class AdminStatsView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        return Response({"total_users": User.objects.count()})


class AdminUserListView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        users = User.objects.order_by("-date_joined")
        return Response(
            {
                "total_users": users.count(),
                "users": UserSerializer(users, many=True).data,
            }
        )


class AdminUserDeleteView(APIView):
    permission_classes = [IsStaffUser]

    def delete(self, request, user_id):
        if str(request.user.id) == str(user_id):
            return Response(
                {"detail": "You cannot delete your own admin account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if user.is_staff:
            return Response(
                {"detail": "Staff accounts cannot be deleted from the panel."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
