from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import EmailTokenObtainPairSerializer, UserSerializer


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = EmailTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
