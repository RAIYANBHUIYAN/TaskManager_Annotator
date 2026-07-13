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

        if not user.check_password(password):
            return Response(generic_error, status=status.HTTP_400_BAD_REQUEST)

        if not user.is_active:
            otp = create_login_otp(user, purpose="signup")
            return Response(
                {
                    "requires_otp": True,
                    "challenge_token": str(otp.challenge_token),
                    "email": user.email,
                    "expires_in": OTP_EXPIRY_MINUTES * 60,
                },
                status=status.HTTP_200_OK,
            )

        otp = create_login_otp(user, purpose="login")
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

        if not user.is_active:
            user.is_active = True
            user.save(update_fields=["is_active"])

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
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
                {"detail": "Verification session expired. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"detail": "A new verification code has been sent."})


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated = serializer.validated_data
        email = validated["email"].lower().strip()
        pending_user = User.objects.filter(email__iexact=email, is_active=False).first()

        if pending_user:
            pending_user.set_password(validated["password"])
            pending_user.first_name = validated.get("first_name", "")
            pending_user.last_name = validated.get("last_name", "")
            pending_user.save(
                update_fields=["password", "first_name", "last_name"],
            )
            user = pending_user
        else:
            user = serializer.save()
            user.is_active = False
            user.save(update_fields=["is_active"])

        otp = create_login_otp(user, purpose="signup")
        return Response(
            {
                "requires_otp": True,
                "challenge_token": str(otp.challenge_token),
                "email": user.email,
                "expires_in": OTP_EXPIRY_MINUTES * 60,
            },
            status=status.HTTP_201_CREATED,
        )


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
