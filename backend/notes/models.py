from django.conf import settings
from django.db import models


class Note(models.Model):
    class Category(models.TextChoices):
        RANDOM_THOUGHTS = "random_thoughts", "Random Thoughts"
        PERSONAL = "personal", "Personal"
        SCHOOL = "school", "School"
        DRAMA = "drama", "Drama"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notes"
    )
    title = models.CharField(max_length=200, blank=True, default="")
    body = models.TextField(blank=True, default="")
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.RANDOM_THOUGHTS
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            # Every list query filters by user and sorts by -updated_at
            # (get_queryset + Meta.ordering), so this composite index lets
            # Postgres satisfy both in one index scan instead of filtering
            # then sorting separately.
            models.Index(fields=["user", "-updated_at"], name="notes_user_updated_idx"),
        ]

    def __str__(self) -> str:
        return self.title or f"Untitled note ({self.pk})"
