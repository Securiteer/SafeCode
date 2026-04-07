import subprocess
import json
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class SemgrepService:
    @staticmethod
    def scan_directory(directory_path: str) -> List[Dict]:
        """
        Runs Semgrep locally on the given directory and returns a list of vulnerabilities.
        """
        try:
            # Run semgrep with auto config, output as JSON
            cmd = ["semgrep", "scan", "--config=auto", "--json", directory_path]
            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode != 0 and not result.stdout:
                logger.error(f"Semgrep failed: {result.stderr}")
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

        except Exception as e:
            logger.error(f"Error running semgrep: {str(e)}")
            return []

    @staticmethod
    def get_file_context(directory_path: str, file_path: str, context_lines: int = 50) -> str:
        """
        Gets the file content for LLM context.
        In a real advanced RAG system, this would also parse imports and fetch related files.
        """
        try:
            full_path = f"{directory_path}/{file_path}"
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Could not read context file {file_path}: {e}")
            return ""
