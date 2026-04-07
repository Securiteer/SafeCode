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
        if model == BotConfig:
            mock_filter = MagicMock()
            def filter_side_effect(*args, **kwargs):
                mock_first = MagicMock()

                # Inspect the SQLALchemy BinaryExpression
                condition = args[0]
                # We can access condition.right.value for the string we are comparing to
                # if it is a simple comparison
                key_val = condition.right.value if hasattr(condition, 'right') else ""

                if key_val == "openai_api_keys":
                    mock_conf = MagicMock()
                    mock_conf.value = ["fake-openai-key-123"]
                    mock_first.first.return_value = mock_conf
                elif key_val == "anthropic_api_keys":
                    mock_conf = MagicMock()
                    mock_conf.value = ["fake-anthropic-key-456"]
                    mock_first.first.return_value = mock_conf
                else:
                    mock_first.first.return_value = None
                return mock_first

            mock_filter.filter.side_effect = filter_side_effect
            return mock_filter
        return MagicMock()

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
    import litellm

    mock_db = MagicMock(spec=Session)
    def mock_query(model):
        mock_filter = MagicMock()
        mock_first = MagicMock()
        mock_conf = MagicMock()
        mock_conf.value = ["fake-openai-key-123"]
        mock_first.first.return_value = mock_conf
        mock_filter.filter.return_value = mock_first
        return mock_filter

    mock_db.query.side_effect = mock_query

    engine = AIEngine(db=mock_db)

    # Mock litellm.completion and completion_cost
    mock_completion = MagicMock()
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "Hello world"
    mock_completion.return_value = mock_response

    monkeypatch.setattr(litellm, "completion", mock_completion)
    monkeypatch.setattr(litellm, "completion_cost", MagicMock(return_value=0.01))

    # Call the fallback function
    res = engine._call_llm_with_fallback(
        model="gpt-4o",
        messages=[{"role": "user", "content": "test"}]
    )

    # Assert litellm was called with the api_key properly extracted from DB
    assert mock_completion.called
    kwargs = mock_completion.call_args.kwargs
    assert kwargs["api_key"] == "fake-openai-key-123"
