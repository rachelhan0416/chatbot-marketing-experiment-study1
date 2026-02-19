#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

HOST = "127.0.0.1"
PORT = 8787
OPENAI_ENDPOINT = "https://api.openai.com/v1/responses"


def make_openai_payload(model: str, system_prompt: str, messages: list[dict], temperature: float | None) -> dict:
    input_messages = [{"role": "system", "content": [{"type": "input_text", "text": system_prompt}]}]
    for msg in messages:
        input_messages.append(
            {
                "role": msg["role"],
                "content": [{"type": "input_text", "text": msg["content"]}],
            }
        )

    payload = {
        "model": model,
        "input": input_messages,
    }
    if temperature is not None:
        payload["temperature"] = temperature
    return payload


def extract_text(response_json: dict) -> str:
    output = response_json.get("output", [])
    chunks = []
    for item in output:
        for content in item.get("content", []):
            if content.get("type") == "output_text" and isinstance(content.get("text"), str):
                chunks.append(content["text"])
    return "\n".join(chunks).strip()


class Handler(BaseHTTPRequestHandler):
    def _set_headers(self, status: int = 200, content_type: str = "application/json") -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.end_headers()

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._set_headers(204)

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/chat":
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode("utf-8"))
            return

        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": "OPENAI_API_KEY is not set in the server environment."}).encode("utf-8"))
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(content_length).decode("utf-8"))
        except Exception:
            self._set_headers(400)
            self.wfile.write(json.dumps({"error": "Invalid JSON body."}).encode("utf-8"))
            return

        model = str(body.get("model", "")).strip() or "gpt-5-mini"
        system_prompt = str(body.get("systemPrompt", "")).strip()
        messages = body.get("messages", [])

        raw_temperature = body.get("temperature")
        temperature = None
        if raw_temperature is not None and raw_temperature != "":
            try:
                temperature = float(raw_temperature)
            except (TypeError, ValueError):
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "temperature must be a number if provided."}).encode("utf-8"))
                return

        if not system_prompt:
            self._set_headers(400)
            self.wfile.write(json.dumps({"error": "systemPrompt is required."}).encode("utf-8"))
            return
        if not isinstance(messages, list):
            self._set_headers(400)
            self.wfile.write(json.dumps({"error": "messages must be an array."}).encode("utf-8"))
            return

        try:
            payload = make_openai_payload(model, system_prompt, messages, temperature)
            req = Request(
                OPENAI_ENDPOINT,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                },
                method="POST",
            )
            with urlopen(req, timeout=60) as res:
                data = json.loads(res.read().decode("utf-8"))
        except HTTPError as exc:
            self._set_headers(exc.code)
            self.wfile.write(json.dumps({"error": exc.read().decode("utf-8", errors="ignore") or "OpenAI HTTP error"}).encode("utf-8"))
            return
        except URLError as exc:
            self._set_headers(502)
            self.wfile.write(json.dumps({"error": f"Network error: {exc.reason}"}).encode("utf-8"))
            return
        except Exception as exc:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": f"Server error: {exc}"}).encode("utf-8"))
            return

        output_text = extract_text(data)
        if not output_text:
            self._set_headers(502)
            self.wfile.write(json.dumps({"error": "No output_text returned from model."}).encode("utf-8"))
            return

        self._set_headers(200)
        self.wfile.write(json.dumps({"outputText": output_text}).encode("utf-8"))


def main() -> None:
    print(f"Scenario Chatbot proxy listening on http://{HOST}:{PORT}")
    HTTPServer((HOST, PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
