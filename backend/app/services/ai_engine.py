"""
Service for interacting with AI models via LiteLLM.
"""
import json
import os
import random
import logging
from typing import Optional, Dict, Any, List
import litellm  # type: ignore
from sqlalchemy.orm import Session
from app.models.models import ModelStat, BotConfig

logger = logging.getLogger(__name__)

litellm.suppress_debug_info = True


class AIEngine:
    """Handles interactions with Language Models."""

    def __init__(self, db: Session):
        self.db = db
        self.api_keys: Dict[str, List[str]] = {}
        self._load_keys_from_db()

    def _load_keys_from_db(self):
        providers = [
            ("openai", "openai_api_keys", "OPENAI_API_KEY"),
            ("anthropic", "anthropic_api_keys", "ANTHROPIC_API_KEY"),
            ("gemini", "gemini_api_keys", "GEMINI_API_KEY"),
            ("groq", "groq_api_keys", "GROQ_API_KEY"),
            ("vertexai", "vertexai_api_keys", "VERTEXAI_API_KEY")
        ]

        db_keys = [p[1] for p in providers] + ["local_base_url"]
        configs = self.db.query(BotConfig).filter(BotConfig.key.in_(db_keys)).all()
        config_map = {conf.key: conf for conf in configs}

        for provider, db_key, env_var in providers:
            conf = config_map.get(db_key)
            if conf and conf.value and isinstance(conf.value, list):
                self.api_keys[provider] = conf.value
            elif conf and conf.value and isinstance(conf.value, str):
                self.api_keys[provider] = [conf.value]
            else:
                self.api_keys[provider] = []

        local_url_conf = self.db.query(BotConfig).filter(BotConfig.key == "local_base_url").first()
        self.local_base_url = local_url_conf.value if local_url_conf else None

    # pylint: disable=too-many-return-statements
    def _get_provider_from_model(self, model: str) -> str:
        if "gpt-" in model or "o1" in model or "o3" in model:
            return "openai"
        if "claude-" in model:
            return "anthropic"
        if "gemini" in model:
            return "gemini"
        if "groq" in model:
            return "groq"
        if "vertex_ai" in model:
            return "vertexai"
        if "ollama" in model or "local" in model:
            return "local"
        if "/" in model:
            return model.split("/")[0]
        return "unknown"

    def _track_cost(
        self, response: Any, task_type: str, provider: str, actual_model: str
    ) -> Dict[str, Any]:
        try:
            model = response.get("model", actual_model)
            usage = response.get("usage", {})
            tokens = usage.get("total_tokens", 0)

            try:
                cost = float(litellm.completion_cost(completion_response=response))
            except Exception:  # pylint: disable=broad-exception-caught
                cost = 0.0

            stat = ModelStat(  # type: ignore
                model_name=model,
                provider=provider,
                task_type=task_type,
                tokens_used=tokens,
                cost_usd=cost
            )
            self.db.add(stat)
            self.db.commit()

            return {"model": model, "cost": cost, "tokens": tokens, "provider": provider}
        except Exception as e:
            logger.error(f"Failed to track cost: {e}")
            return {"model": actual_model, "cost": 0.0, "tokens": 0, "provider": provider}

    def _execute_llm_call(self, kwargs: dict, task_type: str, provider: str, model: str, messages: list) -> dict:
        response = litellm.completion(**kwargs)
        stats = self._track_cost(response, task_type, provider, model)
        return {
            "content": response.choices[0].message.content,
            "stats": stats,
            "prompt_used": json.dumps(messages, indent=2),
            "ai_response": response.choices[0].message.content
        }

    def _attempt_call_with_keys(self, kwargs: dict, keys: list, task_type: str, provider: str, model: str, messages: list, break_on_fatal: bool) -> Optional[dict]:
        for key in keys:
            try:
                if key:
                    kwargs["api_key"] = key
                elif "api_key" in kwargs:
                    del kwargs["api_key"]

                return self._execute_llm_call(kwargs, task_type, provider, model, messages)
            except Exception as e:
                if not break_on_fatal:
                    continue

                err_str = str(e).lower()
                logger.warning(f"Failed with key on model {model}: {e}")
                if "rate limit" not in err_str and "quota" not in err_str and "429" not in err_str:
                    break
        return None

    def _call_llm_with_fallback(self, model: str, messages: list, response_format: dict = None, task_type: str = "generic") -> dict:
        original_provider = self._get_provider_from_model(model)

        fallback_conf = self.db.query(BotConfig).filter(
            BotConfig.key == "auto_fallback_random"
        ).first()
        auto_fallback_random = fallback_conf.value if fallback_conf else False

        keys_to_try: List[Any] = self.api_keys.get(original_provider, [None])
        if not keys_to_try:
            keys_to_try = [None]

        kwargs: Dict[str, Any] = {
            "model": model,
            "messages": messages,
        }
        if response_format:
            kwargs["response_format"] = response_format

        if self.local_base_url and original_provider == "local":
            kwargs["api_base"] = self.local_base_url

        result = self._attempt_call_with_keys(kwargs, keys_to_try, task_type, original_provider, model, messages, break_on_fatal=True)
        if result:
            return result

        if auto_fallback_random:
            logger.warning("Falling back from %s to random provider.", model)
            fallbacks = ["gpt-4o-mini", "claude-3-haiku-20240307", "gemini/gemini-1.5-flash"]
            random.shuffle(fallbacks)

            for fallback_model in fallbacks:
                fallback_provider = self._get_provider_from_model(fallback_model)
                fallback_keys = self.api_keys.get(fallback_provider, [None])
                if not fallback_keys:
                    fallback_keys = [None]

                kwargs["model"] = fallback_model
                if "api_base" in kwargs:
                    del kwargs["api_base"]

                result = self._attempt_call_with_keys(kwargs, fallback_keys, task_type, fallback_provider, fallback_model, messages, break_on_fatal=False)
                if result:
                    return result

        raise ValueError(f"All LLM calls failed for task {task_type}. Original model: {model}")

    def analyze_code_health(self, code_content: str, model: str = "gpt-4o-mini") -> Dict[str, Any]:
        """Analyzes the code for health and quality using LLM."""
        prompt = f"""
        Analyze the following code for health and quality.
        Return a JSON object with:
        1. "score_percent": an integer from 0 to 100 representing overall quality.
        2. "issues": a list of string descriptions of minor issues or bad practices.

        Code:
        ```
        {code_content[:15000]}
        ```
        """
        try:
            res = self._call_llm_with_fallback(
                model,
                [{"role": "user", "content": prompt}],
                {"type": "json_object"},
                "health_analysis"
            )
            return {
                "result": json.loads(res["content"]),
                "stats": res["stats"],
                "prompt": res["prompt_used"],
                "response": res["ai_response"]
            }
        except Exception:  # pylint: disable=broad-exception-caught
            return {"result": {"score_percent": 50, "issues": ["Analysis failed"]}, "stats": {}}

    def fix_vulnerability(
        self,
        code_content: str,
        vulnerability_description: str,
        model: str = "gpt-4o",
        error_feedback: Optional[str] = None
    ) -> Dict[str, Any]:
        """Attempts to fix a vulnerability using LLM."""
        prompt = (
            f"Fix the following vulnerability in the code:\n"
            f"\"{vulnerability_description}\"\n\n"
            f"Return ONLY the fixed code without any markdown formatting or explanation. "
            f"Ensure the entire file is returned correctly, applying only the necessary fix.\n"
        )

        if error_feedback:
            prompt += (
                "\n\nWARNING: Your previous fix failed sandbox tests "
                f"with the following error:\n{error_feedback}\n"
                "Please correct the code so tests pass."
            )

        prompt += f"\n\nCode:\n```\n{code_content[:20000]}\n```"

        try:
            res = self._call_llm_with_fallback(
                model,
                [{"role": "user", "content": prompt}],
                None,
                "fix"
            )
            content = res["content"]
            if content.startswith("```"):
                content = "\n".join(content.split("\n")[1:])
            if content.endswith("```"):
                content = "\n".join(content.split("\n")[:-1])
            return {
                "fixed_code": content.strip(),
                "stats": res["stats"],
                "prompt": res["prompt_used"],
                "response": res["ai_response"]
            }
        except Exception:  # pylint: disable=broad-exception-caught
            return {"fixed_code": code_content, "stats": {}}

    def analyze_and_fix_issue(
        self,
        code_content: str,
        issue_title: str,
        issue_body: str,
        model: str = "gpt-4o"
    ) -> Dict[str, Any]:
        """Attempts to fix a GitHub issue using LLM."""
        prompt = f"""
        Can you fix the following GitHub issue given the codebase content?

        Issue Title: {issue_title}
        Issue Body: {issue_body}

        Return a JSON object:
        {{
           "can_fix": boolean,
           "reason": "short explanation of why or why not",
           "fixed_code": "the complete rewritten code if can_fix is true, else null"
        }}

        Code:
        ```
        {code_content[:20000]}
        ```
        """
        try:
            res = self._call_llm_with_fallback(
                model,
                [{"role": "user", "content": prompt}],
                {"type": "json_object"},
                "issue_fix"
            )
            return {
                "result": json.loads(res["content"]),
                "stats": res["stats"],
                "prompt": res["prompt_used"],
                "response": res["ai_response"]
            }
        except Exception:  # pylint: disable=broad-exception-caught
            return {
                "result": {"can_fix": False, "reason": "Analysis failed", "fixed_code": None},
                "stats": {}
            }
