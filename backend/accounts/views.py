from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .models import User
from .otp import OTP_EXPIRY_MINUTES, create_login_otp, resend_login_otp, verify_login_otp
from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    ResendOTPSerializer,
    UserSerializer,
    VerifyOTPSerializer,
)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].lower().strip()
        password = serializer.validated_data["password"]
        generic_error = {"detail": "Invalid email or password."}

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(generic_error, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(password) or not user.is_active:
            return Response(generic_error, status=status.HTTP_400_BAD_REQUEST)

        otp = create_login_otp(user)
        return Response(
            {
                "requires_otp": True,
                "challenge_token": str(otp.challenge_token),
                "email": user.email,
                "expires_in": OTP_EXPIRY_MINUTES * 60,
            },
            status=status.HTTP_200_OK,
        )


class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = verify_login_otp(
            str(serializer.validated_data["challenge_token"]),
            serializer.validated_data["otp"],
        )
        if not user:
            return Response(
                {"detail": "Invalid or expired verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


class ResendOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not resend_login_otp(str(serializer.validated_data["challenge_token"])):
            return Response(
                {"detail": "Verification session expired. Please sign in again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"detail": "A new verification code has been sent."})


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
