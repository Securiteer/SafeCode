"""
Database models for the AI Security Bot.
"""
import enum
from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, JSON, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class VulnerabilitySeverity(str, enum.Enum):
    """Enum for vulnerability severity levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    HEALTH = "health"  # For code health issues


class VulnerabilityStatus(str, enum.Enum):
    """Enum for vulnerability status."""
    FOUND = "found"
    VERIFIED = "verified"
    FIXED = "fixed"
    FAILED = "failed"


# pylint: disable=too-few-public-methods,not-callable
class Repository(Base):
    """Database model for GitHub repositories."""
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, unique=True, index=True)  # e.g. "facebook/react"
    stars = Column(Integer, default=0)
    themes = Column(JSON, default=list)  # tags/topics
    code_quality_percent = Column(Float, nullable=True)
    last_scanned_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    vulnerabilities = relationship("Vulnerability", back_populates="repository")
    issues_fixed = relationship("IssueFix", back_populates="repository")


class Vulnerability(Base):
    """Database model for found vulnerabilities."""
    __tablename__ = "vulnerabilities"

    id = Column(Integer, primary_key=True, index=True)
    repo_id = Column(Integer, ForeignKey("repositories.id"))
    file_path = Column(String)
    line_number = Column(Integer)
    severity: Column[VulnerabilitySeverity] = Column(Enum(VulnerabilitySeverity))
    description = Column(Text)
    status: Column[VulnerabilityStatus] = Column(
        Enum(VulnerabilityStatus),
        default=VulnerabilityStatus.FOUND
    )
    pr_url = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    repository = relationship("Repository", back_populates="vulnerabilities")


class IssueFix(Base):
    """Database model for GitHub issue fixes."""
    __tablename__ = "issue_fixes"

    id = Column(Integer, primary_key=True, index=True)
    repo_id = Column(Integer, ForeignKey("repositories.id"))
    issue_number = Column(Integer)
    issue_title = Column(String)
    status: Column[VulnerabilityStatus] = Column(
        Enum(VulnerabilityStatus),
        default=VulnerabilityStatus.FOUND
    )
    pr_url = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    repository = relationship("Repository", back_populates="issues_fixed")


class ModelStat(Base):
    """Database model for AI model usage statistics."""
    __tablename__ = "model_stats"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, index=True)
    provider = Column(String, nullable=True)  # E.g., openai, anthropic
    task_type = Column(String)  # e.g., "find", "verify", "fix", "issue_fix"
    tokens_used = Column(Integer, default=0)
    cost_usd = Column(Float, default=0.0)  # Cost in USD
    created_at = Column(DateTime, server_default=func.now())


class BotConfig(Base):
    """Database model for bot configurations."""
    __tablename__ = "bot_configs"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(JSON)
    updated_at = Column(DateTime, onupdate=func.now())


class TerminalLog(Base):
    """Database model for terminal logs."""
    __tablename__ = "terminal_logs"

    id = Column(Integer, primary_key=True, index=True)
    bot_id = Column(String, index=True)
    action = Column(String)
    details = Column(Text)
    model = Column(String, nullable=True)
    cost = Column(Float, default=0.0)
    prompt_used = Column(Text, nullable=True)
    ai_response = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
