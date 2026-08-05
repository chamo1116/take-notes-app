import pytest

from notes import services
from notes.models import Note
from notes.tests.factories import create_note, create_user

pytestmark = pytest.mark.django_db


def test_list_notes_only_returns_own_notes() -> None:
    user = create_user()
    other_user = create_user()
    create_note(user=user, title="Mine")
    create_note(user=other_user, title="Not mine")

    result = services.list_notes(user=user)

    assert [note.title for note in result] == ["Mine"]


def test_list_notes_filters_by_category() -> None:
    user = create_user()
    create_note(user=user, title="School note", category=Note.Category.SCHOOL)
    create_note(user=user, title="Personal note", category=Note.Category.PERSONAL)

    result = services.list_notes(user=user, category=Note.Category.SCHOOL)

    assert [note.title for note in result] == ["School note"]


def test_list_notes_without_category_returns_all() -> None:
    user = create_user()
    create_note(user=user, category=Note.Category.SCHOOL)
    create_note(user=user, category=Note.Category.PERSONAL)

    result = services.list_notes(user=user)

    assert len(result) == 2


def test_create_note_assigns_owner_and_fields() -> None:
    user = create_user()

    note = services.create_note(
        user=user, title="New note", body="Hello", category=Note.Category.SCHOOL
    )

    assert note.pk is not None
    assert note.user == user
    assert note.title == "New note"
    assert note.body == "Hello"
    assert note.category == Note.Category.SCHOOL


def test_update_note_sets_given_fields() -> None:
    note = create_note(title="Old", body="Old body")

    updated = services.update_note(note, title="Updated", body="Updated body")

    assert updated.title == "Updated"
    assert updated.body == "Updated body"
    note.refresh_from_db()
    assert note.title == "Updated"
    assert note.body == "Updated body"


def test_update_note_bumps_updated_at() -> None:
    note = create_note()
    original_updated_at = note.updated_at

    services.update_note(note, body="Changed")

    note.refresh_from_db()
    assert note.updated_at > original_updated_at


def test_delete_note_removes_it() -> None:
    note = create_note()
    note_id = note.id

    services.delete_note(note)

    assert not Note.objects.filter(id=note_id).exists()


def test_get_category_counts_scopes_to_user() -> None:
    user = create_user()
    other_user = create_user()
    create_note(user=user, category=Note.Category.SCHOOL)
    create_note(user=user, category=Note.Category.SCHOOL)
    create_note(user=user, category=Note.Category.PERSONAL)
    create_note(user=other_user, category=Note.Category.SCHOOL)

    counts = services.get_category_counts(user=user)

    assert counts == {
        Note.Category.SCHOOL: 2,
        Note.Category.PERSONAL: 1,
    }


def test_get_category_counts_empty_for_user_with_no_notes() -> None:
    user = create_user()

    counts = services.get_category_counts(user=user)

    assert counts == {}
