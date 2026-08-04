import factory
from factory.django import DjangoModelFactory

from accounts.models import User


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    # factory_boy's stubs don't re-export Sequence from the package root.
    email = factory.Sequence(lambda n: f"user{n}@example.com")  # type: ignore[attr-defined]

    # factory_boy calls this with the built User instance as `self`, but it's
    # syntactically a UserFactory method, so mypy can't see set_password/save.
    @factory.post_generation  # type: ignore[attr-defined]
    def password(self, create: bool, extracted: str | None, **kwargs: object) -> None:
        self.set_password(extracted or "testpass123")  # type: ignore[attr-defined]
        if create:
            self.save()  # type: ignore[attr-defined]
