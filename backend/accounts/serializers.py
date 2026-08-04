from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Issues JWTs for the email/password login endpoint.

    TokenObtainPairSerializer already keys its username field off
    User.USERNAME_FIELD, which is "email" on our custom user model, so no
    field renaming is needed here.
    """
