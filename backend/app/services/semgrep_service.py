"""
Service for running Semgrep static analysis.
"""
import subprocess
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class SemgrepService:
    """Handles Semgrep operations."""

    @staticmethod
    def scan_directory(directory_path: str) -> List[Dict[str, Any]]:
        """
        Runs Semgrep locally on the given directory and returns a list of vulnerabilities.
        """
        try:
            # Run semgrep with auto config, output as JSON
            cmd = ["semgrep", "scan", "--config=auto", "--json", directory_path]
            result = subprocess.run(cmd, capture_output=True, text=True, check=False)

            if result.returncode != 0 and not result.stdout:
                logger.error("Semgrep failed: %s", result.stderr)
                return []

            data = json.loads(result.stdout)
            vulns = []

            for match in data.get("results", []):
                vulns.append({
                    "file": match.get("path"),
                    "line": match.get("start", {}).get("line"),
                    "message": match.get("extra", {}).get("message"),
                    "severity": match.get("extra", {}).get("severity", "WARNING").lower()
                })

            return vulns

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error running semgrep: %s", str(e))
            return []

    @staticmethod
    def get_file_context(directory_path: str, file_path: str) -> str:
        """
        Gets the file content for LLM context.
        In a real advanced RAG system, this would also parse imports and fetch related files.
        """
        try:
            full_path = f"{directory_path}/{file_path}"
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Could not read context file %s: %s", file_path, str(e))
            return ""
