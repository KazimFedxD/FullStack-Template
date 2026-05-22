from __future__ import annotations

from rest_framework import serializers

from .models import Patch


class PatchListItemSerializer(serializers.ModelSerializer):
    version = serializers.CharField(source="version_string", read_only=True)

    class Meta:
        model = Patch
        fields = ["version", "title"]
        read_only_fields = fields


class PatchDetailSerializer(serializers.ModelSerializer):
    version = serializers.CharField(source="version_string", read_only=True)

    class Meta:
        model = Patch
        fields = [
            "version",
            "title",
            "summary",
            "changes",
            "major",
            "minor",
            "patch",
            "stage",
            "stage_number",
            "created_at",
        ]
        read_only_fields = fields
