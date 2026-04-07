"""
Logger for the AI Security Bot terminal.
"""
import json
from datetime import datetime
from typing import Optional
import redis
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.models import TerminalLog

redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)


class TerminalLogger:  # pylint: disable=too-few-public-methods
    """Class to handle terminal logging."""

    # pylint: disable=too-many-arguments,too-many-positional-arguments
    @staticmethod
    def log(
        bot_id: str,
        action: str,
        details: str = "",
        model: str = "",
        cost: float = 0.0,
        prompt_used: Optional[str] = None,
        ai_response: Optional[str] = None
    ):
        """
        Emits a log message to a Redis pub/sub channel.
        Saves full context to the database so the frontend can retrieve the exact prompt/response.
        """
        # Save to DB
        db = SessionLocal()
        try:
            db_log = TerminalLog(
                bot_id=bot_id,
                action=action,
                details=details,
                model=model,
                cost=cost,
                prompt_used=prompt_used,
                ai_response=ai_response
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
            "bot_id": bot_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": action,
            "details": details,
            "model": model,
            "cost": cost,
            "has_context": bool(prompt_used or ai_response)
        }

        redis_client.publish('terminal_logs', json.dumps(log_entry))
        redis_client.lpush('terminal_logs_history', json.dumps(log_entry))
        redis_client.ltrim('terminal_logs_history', 0, 99)
