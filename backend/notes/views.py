from typing import cast

from django.db.models import QuerySet
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer

from accounts.models import User
from notes import services
from notes.models import Note
from notes.serializers import NoteSerializer


class NotePagination(PageNumberPagination):
    # Small enough that the dashboard's infinite scroll has more than one
    # page to fetch without needing dozens of notes to exercise it.
    page_size = 6


class NoteViewSet(viewsets.ModelViewSet[Note]):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotePagination
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "body"]

    def get_queryset(self) -> QuerySet[Note]:
        # IsAuthenticated guarantees a real User here; DRF's stubs still
        # type request.user as the broader AbstractBaseUser | AnonymousUser.
        category = self.request.query_params.get("category")
        return services.list_notes(user=cast(User, self.request.user), category=category)

    def perform_create(self, serializer: BaseSerializer[Note]) -> None:
        serializer.instance = services.create_note(
            user=cast(User, self.request.user), **serializer.validated_data
        )

    def perform_update(self, serializer: BaseSerializer[Note]) -> None:
        instance = cast(Note, serializer.instance)
        serializer.instance = services.update_note(instance, **serializer.validated_data)

    def perform_destroy(self, instance: Note) -> None:
        services.delete_note(instance)

    @action(detail=False, methods=["get"], url_path="category-counts")
    def category_counts(self, request: Request) -> Response:
        counts = services.get_category_counts(user=cast(User, request.user))
        return Response(counts)
