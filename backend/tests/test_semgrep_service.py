import unittest
from unittest.mock import patch, MagicMock
import subprocess
from app.services.semgrep_service import SemgrepService

class TestSemgrepService(unittest.TestCase):
    @patch('subprocess.run')
    def test_scan_directory_exception(self, mock_run):
        # Scenario: subprocess.run raises an Exception
        mock_run.side_effect = Exception("Semgrep error")

        result = SemgrepService.scan_directory("/tmp/fake-path")

        self.assertEqual(result, [])
        mock_run.assert_called_once()

    @patch('subprocess.run')
    def test_scan_directory_failed_no_stdout(self, mock_run):
        # Scenario: subprocess.run returns a non-zero exit code with no stdout
        mock_process = MagicMock()
        mock_process.returncode = 1
        mock_process.stdout = ""
        mock_process.stderr = "Error: some internal error"
        mock_run.return_value = mock_process

        result = SemgrepService.scan_directory("/tmp/fake-path")

        self.assertEqual(result, [])
        mock_run.assert_called_once()

    @patch('subprocess.run')
    def test_scan_directory_success(self, mock_run):
        # Happy path scenario
        mock_process = MagicMock()
        mock_process.returncode = 0
        mock_process.stdout = '{"results": [{"path": "main.py", "start": {"line": 10}, "extra": {"message": "SQL injection", "severity": "ERROR"}}]}'
        mock_run.return_value = mock_process

        result = SemgrepService.scan_directory("/tmp/fake-path")

        expected = [{
            "file": "main.py",
            "line": 10,
            "message": "SQL injection",
            "severity": "error"
        }]
        self.assertEqual(result, expected)
        mock_run.assert_called_once()
