from fastapi.testclient import TestClient
from unittest.mock import MagicMock
import pytest

from app.main import app, get_db
from app.models.models import Repository, Vulnerability, IssueFix, BotConfig

client = TestClient(app)

@pytest.fixture
def override_get_db():
    mock_db = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    yield mock_db
    app.dependency_overrides.clear()

def test_get_dashboard_stats_happy_path(override_get_db):
    mock_db = override_get_db

    # We need to mock several query chains
    # db.query() returns a Query object, we need to mock it depending on arguments

    def mock_query(*args):
        query_mock = MagicMock()

        if len(args) == 1 and args[0] is Repository:
            # db.query(Repository).count() -> 5
            query_mock.count.return_value = 5

        elif len(args) == 1 and args[0] is Vulnerability:
            # This handles two cases:
            # 1. db.query(Vulnerability).count()
            # 2. db.query(Vulnerability).filter(...).count()

            # The direct count call
            query_mock.count.return_value = 10

            # The filter call returning a mock with its own count
            filter_mock = MagicMock()
            filter_mock.count.return_value = 4
            query_mock.filter.return_value = filter_mock

        elif len(args) == 1 and args[0] is IssueFix:
            # db.query(IssueFix).filter(...).count()
            filter_mock = MagicMock()
            filter_mock.count.return_value = 3
            query_mock.filter.return_value = filter_mock

        elif len(args) == 2 and args[0] is Vulnerability.severity:
            # db.query(Vulnerability.severity, func.count(Vulnerability.id)).group_by(...).all()
            group_by_mock = MagicMock()
            # Return tuples of (severity, count)
            group_by_mock.all.return_value = [("high", 2), ("medium", 5), ("low", 3)]
            query_mock.group_by.return_value = group_by_mock

        else:
            # Assuming it's func.sum(ModelStat.cost_usd)
            # db.query(func.sum(ModelStat.cost_usd)).scalar() -> 15.12345
            query_mock.scalar.return_value = 15.12345

        return query_mock

    mock_db.query.side_effect = mock_query

    # Execute request
    response = client.get("/api/stats")

    # Assertions
    assert response.status_code == 200
    data = response.json()

    assert data["total_repos_scanned"] == 5
    assert data["total_vulnerabilities_found"] == 10
    assert data["vulnerabilities_fixed"] == 4
    assert data["issues_fixed"] == 3
    assert data["severity_breakdown"] == {"high": 2, "medium": 5, "low": 3}
    assert data["total_cost_usd"] == 15.1235

def test_get_dashboard_stats_empty_db(override_get_db):
    mock_db = override_get_db

    def mock_query(*args):
        query_mock = MagicMock()

        if len(args) == 1 and args[0] is Repository:
            query_mock.count.return_value = 0
        elif len(args) == 1 and args[0] is Vulnerability:
            query_mock.count.return_value = 0
            filter_mock = MagicMock()
            filter_mock.count.return_value = 0
            query_mock.filter.return_value = filter_mock
        elif len(args) == 1 and args[0] is IssueFix:
            filter_mock = MagicMock()
            filter_mock.count.return_value = 0
            query_mock.filter.return_value = filter_mock
        elif len(args) == 2 and args[0] is Vulnerability.severity:
            group_by_mock = MagicMock()
            group_by_mock.all.return_value = []
            query_mock.group_by.return_value = group_by_mock
        else:
            # Simulating empty db where func.sum returns None
            query_mock.scalar.return_value = None

        return query_mock

    mock_db.query.side_effect = mock_query

    # Execute request
    response = client.get("/api/stats")

    # Assertions
    assert response.status_code == 200
    data = response.json()

    assert data["total_repos_scanned"] == 0
    assert data["total_vulnerabilities_found"] == 0
    assert data["vulnerabilities_fixed"] == 0
    assert data["issues_fixed"] == 0
    assert data["severity_breakdown"] == {}
    assert data["total_cost_usd"] == 0.0

def test_update_config(override_get_db):
    mock_db = override_get_db

    mock_existing_config = MagicMock(spec=BotConfig)
    mock_existing_config.key = "existing_key"
    mock_existing_config.id = 1
    mock_existing_config.value = "old_value"

    mock_db.query.return_value.filter.return_value.all.return_value = [mock_existing_config]

    payload = {
        "configs": {
            "existing_key": "new_value",
            "new_key": "new_value2"
        }
    }

    response = client.post("/api/config", json=payload)

    assert response.status_code == 200
    assert response.json() == {"status": "success"}

    # existing key updated via bulk mappings
    mock_db.bulk_update_mappings.assert_called_once_with(BotConfig, [{"id": 1, "value": "new_value"}])
    # new key added normally
    assert mock_db.add.call_count == 1
    mock_db.commit.assert_called_once()
