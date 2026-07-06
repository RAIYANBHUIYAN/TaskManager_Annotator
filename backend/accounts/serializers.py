from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "date_joined"]
        read_only_fields = fields
