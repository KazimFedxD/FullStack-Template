from __future__ import annotations

import json
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError

from api.models import Patch
from api.utils import VersionParseError, parse_version_string


class Command(BaseCommand):
    help = "Sync patch JSON files from backend/patches into the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--directory",
            type=str,
            default=None,
            help="Optional directory to scan for patch JSON files.",
        )

    def handle(self, *args, **options):
        patch_dir = self._resolve_patch_directory(options.get("directory"))
        files = sorted(patch_dir.glob("*.json"))

        if not files:
            self.stdout.write(
                self.style.WARNING(f"No patch files found in {patch_dir}")
            )
            return

        created = 0
        skipped = 0
        errors = 0

        for file_path in files:
            result = self._process_file(file_path)
            if result == "created":
                created += 1
            elif result == "skipped":
                skipped += 1
            else:
                errors += 1

        summary = (
            f"Patch sync complete. created={created}, skipped={skipped}, errors={errors}"
        )
        if errors:
            self.stdout.write(self.style.WARNING(summary))
        else:
            self.stdout.write(self.style.SUCCESS(summary))

    def _resolve_patch_directory(self, provided: str | None) -> Path:
        if provided:
            patch_dir = Path(provided).expanduser().resolve()
        else:
            patch_dir = (Path(settings.BASE_DIR) / "patches").resolve()

        if not patch_dir.exists() or not patch_dir.is_dir():
            raise CommandError(
                f"Patch directory does not exist or is not a directory: {patch_dir}"
            )

        return patch_dir

    def _process_file(self, file_path: Path) -> str:
        try:
            payload = self._load_json(file_path)
            parsed = parse_version_string(
                str(payload.get("version") or file_path.stem).strip()
            )
            title = self._require_title(payload, file_path)
            summary = str(payload.get("summary") or "").strip()
            changes = self._normalize_changes(payload.get("changes"), file_path)

            defaults = {
                "major": parsed.major,
                "minor": parsed.minor,
                "patch": parsed.patch,
                "stage": parsed.stage,
                "stage_number": parsed.stage_number,
                "title": title,
                "summary": summary,
                "changes": changes,
            }

            _, created = Patch.objects.get_or_create(
                version_string=parsed.version_string,
                defaults=defaults,
            )

            if created:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"[created] {parsed.version_string} from {file_path.name}"
                    )
                )
                return "created"

            self.stdout.write(
                self.style.WARNING(
                    f"[skipped] {parsed.version_string} already exists; keeping DB record"
                )
            )
            return "skipped"

        except (
            json.JSONDecodeError,
            OSError,
            TypeError,
            ValidationError,
            ValueError,
            VersionParseError,
        ) as exc:
            self.stderr.write(self.style.ERROR(f"[error] {file_path.name}: {exc}"))
            return "error"

    def _load_json(self, file_path: Path) -> dict:
        with file_path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)

        if not isinstance(payload, dict):
            raise ValueError("Patch file must contain a JSON object.")

        return payload

    def _require_title(self, payload: dict, file_path: Path) -> str:
        title = str(payload.get("title") or "").strip()
        if not title:
            raise ValueError(f"Missing non-empty 'title' in {file_path.name}")
        return title

    def _normalize_changes(self, raw_changes, file_path: Path) -> dict:
        if not isinstance(raw_changes, dict):
            raise ValueError(f"Missing or invalid 'changes' object in {file_path.name}")

        normalized = {}
        for key in ("added", "improved", "fixed"):
            values = raw_changes.get(key)
            if values is None:
                values = []

            if not isinstance(values, list):
                raise ValueError(
                    f"Changes section '{key}' must be an array in {file_path.name}"
                )

            cleaned = []
            for value in values:
                text = str(value).strip()
                if text:
                    cleaned.append(text)
            normalized[key] = cleaned

        return normalized
