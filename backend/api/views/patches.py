from __future__ import annotations

import logging

from django.conf import settings
from django_ratelimit.decorators import ratelimit
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from api.models import Patch
from api.serializers import PatchDetailSerializer, PatchListItemSerializer
from api.utils import VersionParseError, parse_version_string
from utils.error_handler import ErrorType, error_response, handle_exception, success_response

logger = logging.getLogger("api")

__all__ = ["patches_list", "patches_detail"]


@api_view(["GET"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate=settings.RATE_LIMITS["api"]["general"], method="GET")
def patches_list(request: Request) -> Response:
    try:
        queryset = Patch.objects.with_semantic_order()
        payload = PatchListItemSerializer(queryset, many=True).data

        return success_response(
            message="Patch versions retrieved successfully.",
            data={"items": payload},
            status_code=status.HTTP_200_OK,
        )
    except Exception as exc:
        return handle_exception(
            exc,
            context="patches_list",
            user_message="Failed to load patch versions.",
        )


@api_view(["GET"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate=settings.RATE_LIMITS["api"]["general"], method="GET")
def patches_detail(request: Request, version: str) -> Response:
    try:
        parsed = parse_version_string(version)

        patch = Patch.objects.filter(version_string=parsed.version_string).first()
        if not patch:
            return error_response(
                ErrorType.NOT_FOUND,
                f"Patch '{parsed.version_string}' was not found.",
                status_code=status.HTTP_404_NOT_FOUND,
                log_error=False,
            )

        payload = PatchDetailSerializer(patch).data
        return success_response(
            message="Patch details retrieved successfully.",
            data={"patch": payload},
            status_code=status.HTTP_200_OK,
        )
    except VersionParseError as exc:
        return error_response(
            ErrorType.VALIDATION_ERROR,
            str(exc),
            status_code=status.HTTP_400_BAD_REQUEST,
            log_error=False,
        )
    except Exception as exc:
        return handle_exception(
            exc,
            context="patches_detail",
            user_message="Failed to load patch details.",
        )
