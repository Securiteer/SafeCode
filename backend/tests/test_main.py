from fastapi.testclient import TestClient
from unittest.mock import MagicMock
import pytest
from sqlalchemy import func

from app.main import app, get_db
from app.models.models import Repository, Vulnerability, IssueFix, ModelStat

client = TestClient(app)

def test_get_dashboard_stats_happy_path():
    # Create a mock session
    mock_db = MagicMock()

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

    # Override get_db
    app.dependency_overrides[get_db] = lambda: mock_db

    # Execute request
    response = client.get("/api/stats")

    # Clean up override after test
    app.dependency_overrides.clear()

    # Assertions
    assert response.status_code == 200
    data = response.json()

    assert data["total_repos_scanned"] == 5
    assert data["total_vulnerabilities_found"] == 10
    assert data["vulnerabilities_fixed"] == 4
    assert data["issues_fixed"] == 3
    assert data["severity_breakdown"] == {"high": 2, "medium": 5, "low": 3}
    assert data["total_cost_usd"] == 15.1235

def test_get_dashboard_stats_empty_db():
    # Create a mock session
    mock_db = MagicMock()

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

    # Override get_db
    app.dependency_overrides[get_db] = lambda: mock_db

    # Execute request
    response = client.get("/api/stats")

    # Clean up override after test
    app.dependency_overrides.clear()

    # Assertions
    assert response.status_code == 200
    data = response.json()

    assert data["total_repos_scanned"] == 0
    assert data["total_vulnerabilities_found"] == 0
    assert data["vulnerabilities_fixed"] == 0
    assert data["issues_fixed"] == 0
    assert data["severity_breakdown"] == {}
    assert data["total_cost_usd"] == 0.0
