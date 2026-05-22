from __future__ import annotations

import re
from dataclasses import dataclass

from api.models import PatchStage

_VERSION_PATTERN = re.compile(
    r"^(?P<major>0|[1-9]\d*)\.(?P<minor>0|[1-9]\d*)\.(?P<patch>0|[1-9]\d*)"
    r"(?:-(?P<stage>alpha|beta)\.(?P<stage_number>[1-9]\d*))?$"
)


@dataclass(frozen=True)
class ParsedVersion:
    major: int
    minor: int
    patch: int
    stage: PatchStage
    stage_number: int | None
    version_string: str


class VersionParseError(ValueError):
    pass


def parse_version_string(version: str) -> ParsedVersion:
    """Parse semantic version strings used by patch files and API routes."""
    normalized = (version or "").strip()
    match = _VERSION_PATTERN.match(normalized)
    if not match:
        raise VersionParseError(
            "Invalid version format. Use X.Y.Z, X.Y.Z-beta.N, or X.Y.Z-alpha.N"
        )

    major = int(match.group("major"))
    minor = int(match.group("minor"))
    patch = int(match.group("patch"))

    raw_stage = match.group("stage")
    raw_stage_number = match.group("stage_number")

    if raw_stage is None:
        stage = PatchStage.STABLE
        stage_number = None
        canonical = f"{major}.{minor}.{patch}"
    else:
        stage = {
            PatchStage.ALPHA.value: PatchStage.ALPHA,
            PatchStage.BETA.value: PatchStage.BETA,
        }.get(raw_stage, PatchStage.STABLE)
        stage_number = int(raw_stage_number)
        canonical = f"{major}.{minor}.{patch}-{stage.value}.{stage_number}"

    return ParsedVersion(
        major=major,
        minor=minor,
        patch=patch,
        stage=stage,
        stage_number=stage_number,
        version_string=canonical,
    )
