import unittest
from unittest.mock import patch, MagicMock
import subprocess
import os
from app.services.git_local_service import GitLocalService

class TestGitLocalService(unittest.TestCase):
    @patch('app.services.git_local_service.os.path.exists')
    @patch('app.services.git_local_service.subprocess.run')
    def test_run_sandbox_test_timeout(self, mock_run, mock_exists):
        # Scenario: subprocess.run raises TimeoutExpired
        # Mock exists to simulate finding a package.json
        mock_exists.side_effect = lambda path: path.endswith("package.json")

        mock_run.side_effect = subprocess.TimeoutExpired(cmd=["npm", "test"], timeout=60)

        success, message = GitLocalService.run_sandbox_test("/tmp/fake-dir")

        self.assertFalse(success)
        self.assertEqual(message, "Tests timed out after 60 seconds.")
        mock_run.assert_called_once()

    @patch('app.services.git_local_service.os.path.exists')
    @patch('app.services.git_local_service.subprocess.run')
    def test_run_sandbox_test_success(self, mock_run, mock_exists):
        # Scenario: successful test execution
        mock_exists.side_effect = lambda path: path.endswith("package.json")

        mock_process = MagicMock()
        mock_process.returncode = 0
        mock_process.stdout = "Test passed"
        mock_run.return_value = mock_process

        success, message = GitLocalService.run_sandbox_test("/tmp/fake-dir")

        self.assertTrue(success)
        self.assertEqual(message, "Test passed")
        mock_run.assert_called_once()

    @patch('app.services.git_local_service.os.path.exists')
    @patch('app.services.git_local_service.subprocess.run')
    def test_run_sandbox_test_failure(self, mock_run, mock_exists):
        # Scenario: failed test execution
        mock_exists.side_effect = lambda path: path.endswith("package.json")

        mock_process = MagicMock()
        mock_process.returncode = 1
        mock_process.stdout = ""
        mock_process.stderr = "Test failed"
        mock_run.return_value = mock_process

        success, message = GitLocalService.run_sandbox_test("/tmp/fake-dir")

        self.assertFalse(success)
        self.assertEqual(message, "Test failed")
        mock_run.assert_called_once()

    @patch('app.services.git_local_service.os.path.exists')
    def test_run_sandbox_test_no_framework(self, mock_exists):
        # Scenario: no test framework found
        mock_exists.return_value = False

        success, message = GitLocalService.run_sandbox_test("/tmp/fake-dir")

        self.assertTrue(success)
        self.assertEqual(message, "No test framework detected. Assuming success.")

    @patch('app.services.git_local_service.os.path.exists')
    @patch('app.services.git_local_service.subprocess.run')
    def test_run_sandbox_test_exception(self, mock_run, mock_exists):
        # Scenario: generic exception
        mock_exists.side_effect = lambda path: path.endswith("package.json")
        mock_run.side_effect = Exception("Generic error")

        success, message = GitLocalService.run_sandbox_test("/tmp/fake-dir")

        self.assertFalse(success)
        self.assertEqual(message, "Generic error")
        mock_run.assert_called_once()
