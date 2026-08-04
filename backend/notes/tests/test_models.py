import pytest

from notes.models import Note
from notes.tests.factories import create_note

pytestmark = pytest.mark.django_db


def test_str_returns_title_when_present() -> None:
    note = create_note(title="Grocery list")

    assert str(note) == "Grocery list"


def test_str_falls_back_to_untitled_when_title_is_blank() -> None:
    note = create_note(title="")

    assert str(note) == f"Untitled note ({note.pk})"


def test_default_category_is_random_thoughts() -> None:
    note = create_note()

    assert note.category == Note.Category.RANDOM_THOUGHTS


def test_notes_are_ordered_most_recently_updated_first() -> None:
    older = create_note()
    newer = create_note()

    assert list(Note.objects.all()) == [newer, older]
