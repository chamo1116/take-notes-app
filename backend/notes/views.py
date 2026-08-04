from typing import cast

from django.db.models import Count, QuerySet
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer

from accounts.models import User
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

    def get_queryset(self) -> QuerySet[Note]:
        # IsAuthenticated guarantees a real User here; DRF's stubs still
        # type request.user as the broader AbstractBaseUser | AnonymousUser.
        queryset = Note.objects.filter(user=cast(User, self.request.user))
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    def perform_create(self, serializer: BaseSerializer[Note]) -> None:
        serializer.save(user=cast(User, self.request.user))

    @action(detail=False, methods=["get"], url_path="category-counts")
    def category_counts(self, request: Request) -> Response:
        # Always reflects every category regardless of any ?category=
        # filter, so the sidebar counts stay accurate no matter which
        # filter is currently active.
        rows = (
            Note.objects.filter(user=cast(User, request.user))
            .values("category")
            .annotate(count=Count("id"))
        )
        return Response({row["category"]: row["count"] for row in rows})
