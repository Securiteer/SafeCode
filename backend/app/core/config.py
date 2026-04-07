"""
Application configuration module.
"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings using Pydantic BaseSettings."""
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ai_sec.db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")

    class Config:  # pylint: disable=too-few-public-methods
        """Pydantic model configuration."""
        env_file = ".env"


settings = Settings()
