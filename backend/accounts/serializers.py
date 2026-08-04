from typing import Any

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from accounts.models import User


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Issues JWTs for the email/password login endpoint.

    TokenObtainPairSerializer already keys its username field off
    User.USERNAME_FIELD, which is "email" on our custom user model, so no
    field renaming is needed here.
    """


class RegisterSerializer(serializers.ModelSerializer[User]):
    class Meta:
        model = User
        fields = ["email", "password"]
        extra_kwargs = {
            # The default auto-generated UniqueValidator only catches exact
            # matches and produces an inconsistent message; validate_email
            # below replaces it so every duplicate (case-insensitive too)
            # gets the same, friendlier error.
            "email": {"validators": []},
            "password": {"write_only": True},
        }

    def validate_email(self, value: str) -> str:
        email = User.objects.normalize_email(value)
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return email

    def validate_password(self, value: str) -> str:
        # django's validators raise their own ValidationError, distinct from
        # DRF's, so it has to be translated for the response to be serialized.
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc
        return value

    def create(self, validated_data: dict[str, Any]) -> User:
        return User.objects.create_user(**validated_data)
