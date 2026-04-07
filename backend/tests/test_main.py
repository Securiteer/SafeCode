from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from app.main import app
from app.core.database import get_db
from app.models.models import BotConfig

client = TestClient(app)

import pytest

@pytest.fixture
def mock_db():
    db = MagicMock()
    app.dependency_overrides[get_db] = lambda: db
    yield db
    app.dependency_overrides.clear()

def test_update_config_existing_key(mock_db):
    # Setup mock session
    mock_conf = MagicMock()
    mock_conf.key = "existing_key"
    mock_conf.value = "old_value"

    # Configure mock query chain: db.query().filter().first()
    mock_query = mock_db.query.return_value
    mock_filter = mock_query.filter.return_value
    mock_filter.first.return_value = mock_conf

    payload = {"configs": {"existing_key": "new_value"}}
    response = client.post("/api/config", json=payload)

    assert response.status_code == 200
    assert response.json() == {"status": "success"}

    # Assert query was made for BotConfig
    mock_db.query.assert_called_once_with(BotConfig)
    # Assert value was updated
    assert mock_conf.value == "new_value"
    # Assert add was NOT called since it already existed
    mock_db.add.assert_not_called()
    # Assert commit was called
    mock_db.commit.assert_called_once()

def test_update_config_new_key(mock_db):
    # Configure mock query chain: db.query().filter().first() -> None
    mock_query = mock_db.query.return_value
    mock_filter = mock_query.filter.return_value
    mock_filter.first.return_value = None

    payload = {"configs": {"new_key": "new_value"}}
    response = client.post("/api/config", json=payload)

    assert response.status_code == 200
    assert response.json() == {"status": "success"}

    # Assert query was made for BotConfig
    mock_db.query.assert_called_once_with(BotConfig)
    # Assert add was called since it's a new config
    mock_db.add.assert_called_once()

    # Extract the argument passed to add() and verify it
    added_config = mock_db.add.call_args[0][0]
    assert isinstance(added_config, BotConfig)
    assert added_config.key == "new_key"
    assert added_config.value == "new_value"

    # Assert commit was called
    mock_db.commit.assert_called_once()

def test_update_config_empty_payload(mock_db):
    payload = {"configs": {}}
    response = client.post("/api/config", json=payload)

    assert response.status_code == 200
    assert response.json() == {"status": "success"}

    # Assert query, add were NOT called
    mock_db.query.assert_not_called()
    mock_db.add.assert_not_called()
    # Assert commit was called
    mock_db.commit.assert_called_once()
