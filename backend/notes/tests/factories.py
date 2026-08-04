from typing import Any, cast

import factory
from factory.django import DjangoModelFactory

from accounts.models import User
from accounts.tests.factories import UserFactory
from notes.models import Note


class NoteFactory(DjangoModelFactory[Note]):
    class Meta:
        model = Note

    user = factory.SubFactory(UserFactory)  # type: ignore[attr-defined]
    title = factory.Sequence(lambda n: f"Note {n}")  # type: ignore[attr-defined]
    body = "Some body text"
    category = Note.Category.RANDOM_THOUGHTS


def create_user(**kwargs: Any) -> User:
    # factory_boy's stubs type a Factory call as returning the Factory
    # itself rather than Meta.model, so callers that touch attributes on
    # the result (unlike accounts.tests, which never does) need this cast.
    return cast(User, UserFactory(**kwargs))


def create_note(**kwargs: Any) -> Note:
    return cast(Note, NoteFactory(**kwargs))
