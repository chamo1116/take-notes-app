from django.contrib import admin

from notes.models import Note


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):  # type: ignore[type-arg]
    list_display = ["title", "user", "category", "updated_at"]
    list_filter = ["category"]
    search_fields = ["title", "body"]
    readonly_fields = ["created_at", "updated_at"]
