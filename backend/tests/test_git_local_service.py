import pytest
from unittest.mock import patch, MagicMock
import subprocess
from app.services.git_local_service import GitLocalService

@patch('app.services.git_local_service.subprocess.run')
def test_clone_repository_success(mock_run):
    # Setup
    mock_run.return_value = MagicMock(returncode=0)
    repo_url = "https://github.com/user/repo"
    dest_dir = "/tmp/repo"
    token = "secret_token"

    # Execute
    result = GitLocalService.clone_repository(repo_url, dest_dir, token)

    # Assert
    assert result is True
    expected_url = "https://secret_token@github.com/user/repo"
    mock_run.assert_called_once_with(
        ["git", "clone", "--depth", "1", expected_url, dest_dir],
        capture_output=True,
        text=True
    )

@patch('app.services.git_local_service.logger')
@patch('app.services.git_local_service.subprocess.run')
def test_clone_repository_subprocess_failure(mock_run, mock_logger):
    # Setup
    token = "secret_token"
    error_msg = f"fatal: unable to access 'https://{token}@github.com/user/repo': Could not resolve host"
    mock_run.return_value = MagicMock(returncode=1, stderr=error_msg)

    repo_url = "https://github.com/user/repo"
    dest_dir = "/tmp/repo"

    # Execute
    result = GitLocalService.clone_repository(repo_url, dest_dir, token)

    # Assert
    assert result is False

    # Verify token redaction in logs
    expected_redacted_error = "fatal: unable to access 'https://********@github.com/user/repo': Could not resolve host"
    mock_logger.error.assert_called_once_with(f"Git clone failed: {expected_redacted_error}")

@patch('app.services.git_local_service.logger')
@patch('app.services.git_local_service.subprocess.run')
def test_clone_repository_exception(mock_run, mock_logger):
    # Setup
    token = "secret_token"
    exception_msg = f"Some error with token {token}"
    mock_run.side_effect = Exception(exception_msg)

    repo_url = "https://github.com/user/repo"
    dest_dir = "/tmp/repo"

    # Execute
    result = GitLocalService.clone_repository(repo_url, dest_dir, token)

    # Assert
    assert result is False

    # Verify token redaction in logs
    expected_redacted_exception = "Some error with token ********"
    mock_logger.error.assert_called_once_with(f"Exception during clone: {expected_redacted_exception}")

@patch('app.services.git_local_service.logger')
@patch('app.services.git_local_service.subprocess.run')
def test_clone_repository_no_token(mock_run, mock_logger):
    # Setup
    token = ""
    error_msg = "fatal: repository not found"
    mock_run.return_value = MagicMock(returncode=1, stderr=error_msg)

    repo_url = "https://github.com/user/repo"
    dest_dir = "/tmp/repo"

    # Execute
    result = GitLocalService.clone_repository(repo_url, dest_dir, token)

    # Assert
    assert result is False
    mock_logger.error.assert_called_once_with(f"Git clone failed: {error_msg}")
