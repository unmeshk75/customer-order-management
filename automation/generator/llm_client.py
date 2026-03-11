"""
llm_client.py
────────────────────────────────────────────────────────────────────────────
Two LLM backends, both exposing the same generate(system, user, label) API:

  LLMClient     — Anthropic Python SDK (requires ANTHROPIC_API_KEY in .env)
  SDKClient     — Claude Code CLI subprocess (uses your Claude Code subscription,
                  no API key needed; `claude` must be on PATH)

Use create_client(use_sdk=False) to get the right one based on a flag.

CLI toggle:
  python main.py e2e                  # API mode (default)
  python main.py e2e --sdk            # SDK / Claude Code CLI mode
  python main.py tests --input x.xlsx --sdk
────────────────────────────────────────────────────────────────────────────
"""

import os
import platform
import re
import subprocess
from pathlib import Path

# On Windows, npm global CLIs are installed as .cmd wrappers.
# subprocess needs shell=True (or the .cmd suffix) to find them.
_IS_WINDOWS = platform.system() == 'Windows'

from dotenv import load_dotenv

# Load .env from the generator directory
load_dotenv(dotenv_path=Path(__file__).parent / '.env')

MODEL      = 'claude-sonnet-4-6'
MAX_TOKENS = 8192

# Regex to strip outermost markdown fences
_FENCE_RE = re.compile(r'^```[a-zA-Z]*\s*\n?(.*?)\n?```\s*$', re.DOTALL)


def _strip_fences(text: str) -> str:
    """Remove surrounding markdown code fences if present."""
    m = _FENCE_RE.match(text.strip())
    return m.group(1).strip() if m else text.strip()


def _print_header(label: str, backend: str) -> None:
    if label:
        print(f'\n[{backend}] generating: {label}')
    print(f'[{backend}] ' + '-' * 60)


# ══════════════════════════════════════════════════════════════════════════
# Backend 1 — Anthropic API (streaming)
# ══════════════════════════════════════════════════════════════════════════

class LLMClient:
    """
    Calls Claude via the Anthropic Python SDK.
    Requires ANTHROPIC_API_KEY in automation/generator/.env
    """

    def __init__(self, model: str = MODEL):
        try:
            import anthropic as _anthropic
        except ImportError:
            raise ImportError(
                'anthropic package not installed. Run: pip install anthropic'
            )
        api_key = os.environ.get('ANTHROPIC_API_KEY')
        if not api_key:
            raise EnvironmentError(
                'ANTHROPIC_API_KEY is not set. '
                'Copy .env.example -> .env and add your key.'
            )
        self._anthropic = _anthropic
        self.client = _anthropic.Anthropic(api_key=api_key)
        self.model  = model

    def generate(self, system: str, user: str, label: str = '') -> str:
        """Stream response, print tokens as they arrive, return stripped text."""
        _print_header(label, 'api')

        chunks: list[str] = []
        with self.client.messages.stream(
            model=self.model,
            max_tokens=MAX_TOKENS,
            system=system,
            messages=[{'role': 'user', 'content': user}],
        ) as stream:
            for text in stream.text_stream:
                print(text, end='', flush=True)
                chunks.append(text)

        print(f'\n[api] ' + '-' * 60)
        return _strip_fences(''.join(chunks))


# ══════════════════════════════════════════════════════════════════════════
# Backend 2 — Claude Code CLI (subprocess)
# ══════════════════════════════════════════════════════════════════════════

class SDKClient:
    """
    Calls Claude via the `claude` CLI tool (Claude Code).
    No ANTHROPIC_API_KEY needed — uses your Claude Code subscription.
    Requires `claude` to be on PATH:
      npm install -g @anthropic-ai/claude-code

    Windows note: npm global CLIs are .cmd wrappers; we use shell=True so
    the OS can resolve `claude` -> `claude.cmd` automatically.
    """

    def __init__(self, model: str = MODEL):
        self.model = model
        self._check_claude_available()

    def _check_claude_available(self) -> None:
        try:
            result = subprocess.run(
                'claude --version',
                capture_output=True,
                text=True,
                shell=True,          # resolves claude.cmd on Windows
            )
        except Exception as exc:
            raise EnvironmentError(
                '`claude` CLI not found. '
                'Install with: npm install -g @anthropic-ai/claude-code'
            ) from exc

        if result.returncode != 0:
            raise EnvironmentError(
                '`claude` CLI not found on PATH. '
                'Install with: npm install -g @anthropic-ai/claude-code\n'
                f'stderr: {result.stderr.strip()}'
            )

    def generate(self, system: str, user: str, label: str = '') -> str:
        """
        Invoke:  echo "<combined prompt>" | claude --print --model <model>

        The claude CLI does not support a --system flag, so system and user
        prompts are combined into one message separated by a clear divider.
        The entire combined prompt is piped via stdin to avoid Windows
        cmd.exe command-line length limits.
        """
        _print_header(label, 'sdk')

        # Combine system + user into a single prompt that Claude Code understands.
        combined = (
            f'{system}\n\n'
            f'{"─" * 60}\n\n'
            f'{user}'
        )

        # On Windows, npm global CLIs are .cmd wrappers — need shell=True.
        # On Unix, use a list (safer, no length concern).
        if _IS_WINDOWS:
            cmd: str | list = f'claude --print --model {self.model}'
            use_shell = True
        else:
            cmd = ['claude', '--print', '--model', self.model]
            use_shell = False

        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8',
            shell=use_shell,
        )

        stdout_data, stderr_data = process.communicate(input=combined)

        print(stdout_data, end='', flush=True)

        if process.returncode != 0:
            raise RuntimeError(f'claude CLI failed (exit {process.returncode}): {stderr_data.strip()}')

        print(f'\n[sdk] ' + '-' * 60)
        return _strip_fences(stdout_data)


# ══════════════════════════════════════════════════════════════════════════
# Factory
# ══════════════════════════════════════════════════════════════════════════

def create_client(use_sdk: bool = False, model: str = MODEL) -> LLMClient | SDKClient:
    """
    Return the appropriate client based on the --sdk flag.

    use_sdk=False  →  LLMClient  (Anthropic API, needs ANTHROPIC_API_KEY)
    use_sdk=True   →  SDKClient  (claude CLI, needs Claude Code on PATH)
    """
    if use_sdk:
        print('[client] using Claude Code CLI (sdk mode)')
        return SDKClient(model=model)
    print('[client] using Anthropic API (api mode)')
    return LLMClient(model=model)
