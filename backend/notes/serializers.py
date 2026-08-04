from rest_framework import serializers

from notes.models import Note


class NoteSerializer(serializers.ModelSerializer[Note]):
    class Meta:
        model = Note
        fields = ["id", "title", "body", "category", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
