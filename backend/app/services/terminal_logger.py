import redis
import json
from datetime import datetime
from dataclasses import dataclass
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

class TerminalLogger:
    @staticmethod
    def log(bot_id: str, action: str, details: str = "", extra: LogExtra | None = None):
        """
        Emits a log message to a Redis pub/sub channel.
        Saves full context to the database so the frontend can retrieve the exact prompt/response.
        """
        if extra is None:
            extra = LogExtra()

        # Save to DB
        db = SessionLocal()
        try:
            db_log = TerminalLog(
                bot_id=bot_id,
                action=action,
                details=details,
                model=extra.model,
                cost=extra.cost,
                prompt_used=extra.prompt_used,
                ai_response=extra.ai_response
            )
            db.add(db_log)
            db.commit()
            db.refresh(db_log)
            log_id = db_log.id
        except Exception as e:
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
            "model": extra.model,
            "cost": extra.cost,
            "has_context": bool(extra.prompt_used or extra.ai_response)
        }

        redis_client.publish('terminal_logs', json.dumps(log_entry))
        redis_client.lpush('terminal_logs_history', json.dumps(log_entry))
        redis_client.ltrim('terminal_logs_history', 0, 99)
