"""Use cases for the notes domain: the only layer allowed to touch Note's ORM API.

Views translate HTTP <-> Python and call these functions; these functions
own the business rules (ownership scoping, aggregation) so the same use
case can't drift between call sites.
"""

from typing import Any

from django.db.models import Count, QuerySet

from accounts.models import User
from notes.models import Note


def list_notes(*, user: User, category: str | None = None) -> QuerySet[Note]:
    queryset = Note.objects.filter(user=user)
    if category:
        queryset = queryset.filter(category=category)
    return queryset


def create_note(*, user: User, **fields: Any) -> Note:
    return Note.objects.create(user=user, **fields)


def update_note(note: Note, **fields: Any) -> Note:
    for field, value in fields.items():
        setattr(note, field, value)
    note.save()
    return note


def delete_note(note: Note) -> None:
    note.delete()


def get_category_counts(*, user: User) -> dict[str, int]:
    # Always reflects every category regardless of any ?category= filter,
    # so the sidebar counts stay accurate no matter which filter is active.
    rows = Note.objects.filter(user=user).values("category").annotate(count=Count("id"))
    return {row["category"]: row["count"] for row in rows}
