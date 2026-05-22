from __future__ import annotations
from typing import Any, Awaitable, Callable, Optional

from channels.generic.websocket import AsyncWebsocketConsumer

import json
import logging
from logging import Logger
import time


class WSConsumer(AsyncWebsocketConsumer):
    logger: Logger = logging.getLogger(__name__)

    async def send_json(self, content: dict[Any, Any]) -> None:
        await self.send(text_data=json.dumps(content))

    async def send_bytes(self, content: bytes) -> None:
        await self.send(bytes_data=content)

    async def send_event(
        self, event_type: str, data: Optional[dict[Any, Any]] = None
    ) -> None:
        if data is None:
            data = {}
        await self.send_json({"type": event_type, "data": data})

    async def handle_ping(self, payload: dict[str, Any]) -> None:
        await self.send_event("pong", {"server_time": time.time()})

    async def send_error(self, message: str) -> None:
        await self.send_event("error", {"message": message})

    async def send_success(
        self, message: str, data: Optional[dict[Any, Any]] = None
    ) -> None:
        if data is None:
            data = {}
        await self.send_event("success", {"message": message, "data": data})

    async def receive(
        self, text_data: str | None = None, bytes_data: bytes | None = None
    ) -> None:
        if text_data:
            try:
                # Parse JSON
                data = json.loads(text_data)
                event_type = data.get("type")

                if not event_type:
                    self.logger.warning("Received message without event type")
                    return await self.send_error("Event type is required")

                # Get handler for this event
                handler: Optional[Callable[[dict[str, Any]], Awaitable[Any]]] = getattr(
                    self, f"handle_{event_type}", None
                )
                if not handler:
                    self.logger.warning(f"Unknown event type received: {event_type}")
                    return await self.send_error("Unknown event type")

                self.logger.debug(f"Received event: {event_type} with data: {data}")

                await handler(data)

            except json.JSONDecodeError as e:
                self.logger.error(f"Invalid JSON received: {str(e)}")
                return await self.send_error("Invalid JSON format")
            except Exception as e:
                self.logger.error(f"Error processing message: {str(e)}", exc_info=True)
                return await self.send_error("Error processing message")
