"""
Main FastAPI application entry point.
"""
import os
import sys
import asyncio
import datetime
from typing import Dict, Any

from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import redis.asyncio as aioredis
from pydantic import BaseModel

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# pylint: disable=wrong-import-position
from app.core.database import get_db
from app.core.config import settings
from app.models.models import (
    Vulnerability, Repository, ModelStat, BotConfig, IssueFix, TerminalLog
)

# flake8: noqa: E402
app = FastAPI(title="AI Security Bot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Returns dashboard statistics."""
    total_repos = db.query(Repository).count()
    total_vulns = db.query(Vulnerability).count()
    fixed_vulns = db.query(Vulnerability).filter(
        Vulnerability.status == "fixed").count()
    fixed_issues = db.query(IssueFix).filter(IssueFix.status == "fixed").count()

    severity_counts = db.query(
        Vulnerability.severity, func.count(Vulnerability.id)  # pylint: disable=not-callable
    ).group_by(Vulnerability.severity).all()
    severity_dict = {sev: count for sev, count in severity_counts}

    cost_usd = db.query(func.sum(ModelStat.cost_usd)).scalar() or 0.0

    return {
        "total_repos_scanned": total_repos,
        "total_vulnerabilities_found": total_vulns,
        "vulnerabilities_fixed": fixed_vulns,
        "issues_fixed": fixed_issues,
        "severity_breakdown": severity_dict,
        "total_cost_usd": round(cost_usd, 4)
    }


@app.get("/api/models")
def get_model_stats(db: Session = Depends(get_db)):
    """Returns model usage statistics."""
    stats = db.query(
        ModelStat.model_name,
        func.count(ModelStat.id).label("requests"),  # pylint: disable=not-callable
        func.sum(ModelStat.tokens_used).label("total_tokens"),
        func.sum(ModelStat.cost_usd).label("total_cost")
    ).group_by(ModelStat.model_name).all()

    return [
        {
            "model": s.model_name,
            "requests": s.requests,
            "tokens": s.total_tokens,
            "cost": round(s.total_cost, 4)
        }
        for s in stats
    ]


@app.get("/api/repositories")
def list_repositories(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Lists scanned repositories."""
    repos = db.query(Repository).order_by(
        Repository.last_scanned_at.desc()
    ).offset(skip).limit(limit).all()
    return repos


@app.get("/api/config")
def get_config(db: Session = Depends(get_db)):
    """Returns bot configurations."""
    configs = db.query(BotConfig).all()
    return {c.key: c.value for c in configs}


class ConfigUpdate(BaseModel):
    """Payload model for config updates."""
    configs: Dict[str, Any]


@app.post("/api/config")
def update_config(payload: ConfigUpdate, db: Session = Depends(get_db)):
    keys = list(payload.configs.keys())
    existing_configs = db.query(BotConfig).filter(BotConfig.key.in_(keys)).all()
    config_dict = {c.key: c for c in existing_configs}

    for k, v in payload.configs.items():
        if k in config_dict:
            config_dict[k].value = v
        else:
            conf = BotConfig(key=k, value=v)
            db.add(conf)
    db.commit()
    return {"status": "success"}

@app.websocket("/ws/terminal")
async def websocket_terminal(websocket: WebSocket):
    """WebSocket endpoint for live terminal logs."""
    await websocket.accept()
    redis_conn = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    pubsub = redis_conn.pubsub()
    await pubsub.subscribe("terminal_logs")

    try:
        # aioredis typing in lrange can be tricky
        history_coro = redis_conn.lrange("terminal_logs_history", 0, 50)
        history_raw = await history_coro if asyncio.iscoroutine(history_coro) else history_coro
        if isinstance(history_raw, list):
            for msg in reversed(history_raw):
                await websocket.send_text(str(msg))

        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message:
                await websocket.send_text(message["data"])
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe("terminal_logs")
        await pubsub.close()
        await redis_conn.close()

@app.get("/api/terminal/{log_id}")
def get_terminal_log_details(log_id: int, db: Session = Depends(get_db)):
    """Returns details for a specific terminal log."""
    log = db.query(TerminalLog).filter(TerminalLog.id == log_id).first()
    if not log:
        return {"error": "Not found"}
    return {
        "prompt": log.prompt_used,
        "response": log.ai_response,
        "details": log.details,
        "action": log.action
    }

@app.get("/api/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    """Returns top repositories with fixed vulnerabilities."""
    repos = db.query(Repository).join(
        Vulnerability, Repository.id == Vulnerability.repo_id
    ).filter(
        Vulnerability.status == "fixed"
    ).group_by(Repository.id).order_by(
        func.count(Vulnerability.id).desc()  # pylint: disable=not-callable
    ).limit(10).all()

    return [
        {
            "repo": r.full_name,
            "fixes": len([v for v in r.vulnerabilities if v.status == "fixed"]),
            "quality": r.code_quality_percent
        }
        for r in repos
    ]


@app.get("/api/charts")
def get_charts_data(db: Session = Depends(get_db)):
    """Returns data for dashboard charts."""
    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=7)

    # Very simple group by date
    vulns = db.query(
        func.date(Vulnerability.created_at), func.count(Vulnerability.id)  # pylint: disable=not-callable
    ).filter(
        Vulnerability.created_at >= start_date
    ).group_by(func.date(Vulnerability.created_at)).all()

    return [{"date": str(date), "count": count} for date, count in vulns]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
