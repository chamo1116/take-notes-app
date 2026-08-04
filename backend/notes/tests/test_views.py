import pytest
from rest_framework import status
from rest_framework.test import APIClient

from notes.models import Note
from notes.tests.factories import create_note, create_user

pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


def test_list_notes_requires_authentication(api_client: APIClient) -> None:
    response = api_client.get("/api/v1/notes/")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_list_notes_only_returns_own_notes(api_client: APIClient) -> None:
    user = create_user()
    other_user = create_user()
    create_note(user=user, title="Mine")
    create_note(user=other_user, title="Not mine")
    api_client.force_authenticate(user=user)

    response = api_client.get("/api/v1/notes/")

    assert response.status_code == status.HTTP_200_OK
    titles = [note["title"] for note in response.data["results"]]
    assert titles == ["Mine"]


def test_create_note_assigns_current_user(api_client: APIClient) -> None:
    user = create_user()
    api_client.force_authenticate(user=user)

    response = api_client.post(
        "/api/v1/notes/",
        {"title": "New note", "body": "Hello", "category": Note.Category.SCHOOL},
    )

    assert response.status_code == status.HTTP_201_CREATED
    note = Note.objects.get(id=response.data["id"])
    assert note.user == user
    assert note.category == Note.Category.SCHOOL


def test_create_note_with_invalid_category_returns_400(api_client: APIClient) -> None:
    user = create_user()
    api_client.force_authenticate(user=user)

    response = api_client.post(
        "/api/v1/notes/", {"title": "New note", "body": "Hello", "category": "invalid"}
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_partial_update_autosaves_title_and_body(api_client: APIClient) -> None:
    user = create_user()
    note = create_note(user=user, title="Old", body="Old body")
    api_client.force_authenticate(user=user)

    response = api_client.patch(
        f"/api/v1/notes/{note.id}/", {"title": "Updated", "body": "Updated body"}
    )

    assert response.status_code == status.HTTP_200_OK
    note.refresh_from_db()
    assert note.title == "Updated"
    assert note.body == "Updated body"


def test_partial_update_bumps_updated_at(api_client: APIClient) -> None:
    user = create_user()
    note = create_note(user=user)
    original_updated_at = note.updated_at
    api_client.force_authenticate(user=user)

    response = api_client.patch(f"/api/v1/notes/{note.id}/", {"body": "Changed"})

    assert response.status_code == status.HTTP_200_OK
    note.refresh_from_db()
    assert note.updated_at > original_updated_at


def test_cannot_view_another_users_note(api_client: APIClient) -> None:
    owner = create_user()
    intruder = create_user()
    note = create_note(user=owner)
    api_client.force_authenticate(user=intruder)

    response = api_client.get(f"/api/v1/notes/{note.id}/")

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_cannot_update_another_users_note(api_client: APIClient) -> None:
    owner = create_user()
    intruder = create_user()
    note = create_note(user=owner, title="Original")
    api_client.force_authenticate(user=intruder)

    response = api_client.patch(f"/api/v1/notes/{note.id}/", {"title": "Hacked"})

    assert response.status_code == status.HTTP_404_NOT_FOUND
    note.refresh_from_db()
    assert note.title == "Original"


def test_delete_note(api_client: APIClient) -> None:
    user = create_user()
    note = create_note(user=user)
    api_client.force_authenticate(user=user)

    response = api_client.delete(f"/api/v1/notes/{note.id}/")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not Note.objects.filter(id=note.id).exists()


def test_list_notes_filters_by_category(api_client: APIClient) -> None:
    user = create_user()
    create_note(user=user, title="School note", category=Note.Category.SCHOOL)
    create_note(user=user, title="Personal note", category=Note.Category.PERSONAL)
    api_client.force_authenticate(user=user)

    response = api_client.get("/api/v1/notes/", {"category": Note.Category.SCHOOL})

    assert response.status_code == status.HTTP_200_OK
    titles = [note["title"] for note in response.data["results"]]
    assert titles == ["School note"]


def test_list_notes_paginates(api_client: APIClient) -> None:
    user = create_user()
    for _ in range(7):
        create_note(user=user)
    api_client.force_authenticate(user=user)

    response = api_client.get("/api/v1/notes/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 7
    assert len(response.data["results"]) == 6
    assert response.data["next"] is not None


def test_category_counts_requires_authentication(api_client: APIClient) -> None:
    response = api_client.get("/api/v1/notes/category-counts/")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_category_counts_reflects_all_categories_regardless_of_filter(
    api_client: APIClient,
) -> None:
    user = create_user()
    other_user = create_user()
    create_note(user=user, category=Note.Category.SCHOOL)
    create_note(user=user, category=Note.Category.SCHOOL)
    create_note(user=user, category=Note.Category.PERSONAL)
    create_note(user=other_user, category=Note.Category.SCHOOL)
    api_client.force_authenticate(user=user)

    response = api_client.get("/api/v1/notes/category-counts/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {
        Note.Category.SCHOOL: 2,
        Note.Category.PERSONAL: 1,
    }
