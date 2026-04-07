import os
import pytest
from unittest.mock import Mock, MagicMock
from sqlalchemy.orm import Session
from app.services.ai_engine import AIEngine
from app.models.models import BotConfig

def test_load_keys_from_db_does_not_mutate_environ(monkeypatch):
    # Setup mock DB session
    mock_db = MagicMock(spec=Session)

    # Mock the query behavior to return a specific api key for openai
    def mock_query(model):
        mock_filter = MagicMock()
        def all_side_effect(*args, **kwargs):
            mock_conf_openai = MagicMock()
            mock_conf_openai.key = "openai_api_keys"
            mock_conf_openai.value = ["fake-openai-key-123"]

            mock_conf_anthropic = MagicMock()
            mock_conf_anthropic.key = "anthropic_api_keys"
            mock_conf_anthropic.value = ["fake-anthropic-key-456"]

            return [mock_conf_openai, mock_conf_anthropic]

        mock_filter.filter.return_value.all.side_effect = all_side_effect
        mock_filter.filter.return_value.first.return_value = None # For local_base_url
        return mock_filter

    mock_db.query.side_effect = mock_query

    # Clean the environment for test isolation
    for var in ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY", "GROQ_API_KEY", "VERTEXAI_API_KEY"]:
        if var in os.environ:
            monkeypatch.delenv(var)

    # Initialize AIEngine
    engine = AIEngine(db=mock_db)

    # Verify keys were loaded properly into instance attributes
    assert engine.api_keys["openai"] == ["fake-openai-key-123"]
    assert engine.api_keys["anthropic"] == ["fake-anthropic-key-456"]

    # Verify that environment variables were NOT mutated
    assert "OPENAI_API_KEY" not in os.environ
    assert "ANTHROPIC_API_KEY" not in os.environ

def test_call_llm_with_fallback_passes_api_key_explicitly(monkeypatch):
    import app.services.ai_engine

    mock_db = MagicMock(spec=Session)
    def mock_query(model):
        mock_filter = MagicMock()
        def all_side_effect(*args, **kwargs):
            mock_conf = MagicMock()
            mock_conf.key = "openai_api_keys"
            mock_conf.value = ["fake-openai-key-123"]
            return [mock_conf]
        mock_filter.filter.return_value.all.side_effect = all_side_effect
        mock_filter.filter.return_value.first.return_value = None # For auto_fallback_random
        return mock_filter

    mock_db.query.side_effect = mock_query

    engine = AIEngine(db=mock_db)

    # Mock litellm.completion and completion_cost
    mock_completion = MagicMock()
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "Hello world"
    mock_completion.return_value = mock_response

    monkeypatch.setattr(app.services.ai_engine.litellm, "completion", mock_completion)
    monkeypatch.setattr(app.services.ai_engine.litellm, "completion_cost", MagicMock(return_value=0.01))

    # Call the fallback function
    res = engine._call_llm_with_fallback(
        model="gpt-4o",
        messages=[{"role": "user", "content": "test"}]
    )

    # Assert litellm was called with the api_key properly extracted from DB
    assert mock_completion.called
    kwargs = mock_completion.call_args.kwargs
    assert kwargs["api_key"] == "fake-openai-key-123"
