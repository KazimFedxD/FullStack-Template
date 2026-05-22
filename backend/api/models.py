from __future__ import annotations

from uuid import uuid4

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Case, F, IntegerField, Value, When
from django.db.models.functions import Coalesce


class PatchStage(models.TextChoices):
	ALPHA = "alpha", "Alpha"
	BETA = "beta", "Beta"
	STABLE = "stable", "Stable"


class PatchQuerySet(models.QuerySet):
	def with_semantic_order(self) -> models.QuerySet:
		"""Order versions using semver precedence and stage priority."""
		stage_priority = Case(
			When(stage=PatchStage.STABLE, then=Value(3)),
			When(stage=PatchStage.BETA, then=Value(2)),
			When(stage=PatchStage.ALPHA, then=Value(1)),
			default=Value(0),
			output_field=IntegerField(),
		)

		return self.annotate(
			_stage_priority=stage_priority,
			_stage_number_order=Coalesce(F("stage_number"), Value(-1)),
		).order_by(
			"-major",
			"-minor",
			"-patch",
			"-_stage_priority",
			"-_stage_number_order",
			"-created_at",
		)


class PatchManager(models.Manager.from_queryset(PatchQuerySet)):
	pass


class Patch(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
	major = models.PositiveIntegerField()
	minor = models.PositiveIntegerField()
	patch = models.PositiveIntegerField()
	stage = models.CharField(
		max_length=12,
		choices=PatchStage.choices,
		default=PatchStage.STABLE,
	)
	stage_number = models.PositiveIntegerField(null=True, blank=True)

	version_string = models.CharField(max_length=64, unique=True)
	title = models.TextField()
	summary = models.TextField(blank=True, default="")
	changes = models.JSONField(default=dict)
	created_at = models.DateTimeField(auto_now_add=True)

	objects = PatchManager()

	class Meta:
		indexes = [
			models.Index(fields=["major", "minor", "patch"]),
			models.Index(fields=["stage", "stage_number"]),
			models.Index(fields=["created_at"]),
		]

	def __str__(self) -> str:
		return self.version_string

	def clean(self) -> None:
		changes = self.changes if isinstance(self.changes, dict) else {}
		required_sections = ("added", "improved", "fixed")

		for section in required_sections:
			values = changes.get(section)
			if values is None:
				raise ValidationError(
					{"changes": f"Missing '{section}' section in changes."}
				)

			if not isinstance(values, list):
				raise ValidationError(
					{"changes": f"The '{section}' section must be an array."}
				)

		if self.stage == PatchStage.STABLE and self.stage_number is not None:
			raise ValidationError(
				{"stage_number": "Stable releases must not define a stage number."}
			)

		if self.stage in (PatchStage.ALPHA, PatchStage.BETA):
			if self.stage_number is None or self.stage_number < 1:
				raise ValidationError(
					{
						"stage_number": "Alpha/Beta releases require stage_number >= 1."
					}
				)

	def save(self, *args, **kwargs):
		self.full_clean()
		return super().save(*args, **kwargs)
