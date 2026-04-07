"""
Logger for the AI Security Bot terminal.
"""
import json
from datetime import datetime
from dataclasses import dataclass
import redis
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.models import TerminalLog

redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

@dataclass
class LogExtra:
    model: str = ""
    cost: float = 0.0
    prompt_used: str | None = None
    ai_response: str | None = None

@dataclass
class LogEvent:
    bot_id: str
    action: str
    details: str = ""
    model: str = ""
    cost: float = 0.0
    prompt_used: str | None = None
    ai_response: str | None = None


class TerminalLogger:
    """Handles logging for the terminal."""

    @staticmethod
    def log(bot_id: str, action: str, details: str = "", extra: LogExtra | None = None):
        """Legacy helper. Use log_event instead."""
        event = LogEvent(
            bot_id=bot_id,
            action=action,
            details=details,
            model=extra.model if extra else "",
            cost=extra.cost if extra else 0.0,
            prompt_used=extra.prompt_used if extra else None,
            ai_response=extra.ai_response if extra else None
        )
        TerminalLogger.log_event(event)

    @staticmethod
    def log_event(event: LogEvent):
        """
        Emits a log message to a Redis pub/sub channel.
        Saves full context to the database so the frontend can retrieve the exact prompt/response.
        """
        # Save to DB
        db = SessionLocal()
        try:
            db_log = TerminalLog(
                bot_id=event.bot_id,
                action=event.action,
                details=event.details,
                model=event.model,
                cost=event.cost,
                prompt_used=event.prompt_used,
                ai_response=event.ai_response
            )
            db.add(db_log)
            db.commit()
            db.refresh(db_log)
            log_id = db_log.id
        except Exception as e:  # pylint: disable=broad-exception-caught
            print(f"Error saving terminal log to DB: {e}")
            log_id = None
        finally:
            db.close()

        # Send over WebSocket
        log_entry = {
            "id": log_id,
            "bot_id": event.bot_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": event.action,
            "details": event.details,
            "model": event.model,
            "cost": event.cost,
            "has_context": bool(event.prompt_used or event.ai_response)
        }

        redis_client.publish('terminal_logs', json.dumps(log_entry))
        redis_client.lpush('terminal_logs_history', json.dumps(log_entry))
        redis_client.ltrim('terminal_logs_history', 0, 99)
