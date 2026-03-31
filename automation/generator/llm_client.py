"""
llm_client.py
────────────────────────────────────────────────────────────────────────────
Four LLM backends, all exposing the same generate(system, user, label) API:

  LLMClient       — Anthropic Python SDK   (ANTHROPIC_API_KEY in .env)
  SDKClient       — Claude Code CLI        (claude on PATH, no API key)
  GeminiClient    — Google Gemini API      (GEMINI_API_KEY in .env)
  VertexAIClient  — Google Vertex AI       (GCP_CREDENTIALS_PATH, GCP_PROJECT,
                                            GCP_LOCATION in .env)

Use create_client(provider=...) to get the right one.

CLI flag:
  python main.py e2e --provider anthropic   # default
  python main.py e2e --provider sdk         # Claude Code CLI
  python main.py e2e --provider gemini      # Gemini API
  python main.py e2e --provider vertexai    # Vertex AI

  python main.py e2e --sdk                  # legacy alias for --provider sdk
────────────────────────────────────────────────────────────────────────────
"""

import os
import platform
import re
import shutil
import subprocess
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the generator directory
load_dotenv(dotenv_path=Path(__file__).parent / '.env')

# On Windows, npm global CLIs are installed as .cmd wrappers.
_IS_WINDOWS = platform.system() == 'Windows'

# ── default models ─────────────────────────────────────────────────────────
ANTHROPIC_MODEL  = 'claude-sonnet-4-6'
GEMINI_MODEL     = 'gemini-2.0-flash'
VERTEX_MODEL     = 'gemini-2.0-flash'
MAX_TOKENS       = 8192

# Regex to find the first (and likely only) code block in the response
_FENCE_RE = re.compile(r'```[a-zA-Z]*\s*\n(.*?)\n```', re.DOTALL)


def _strip_fences(text: str) -> str:
    """Extract code from the first markdown code fence block; strip all surrounding text."""
    m = _FENCE_RE.search(text.strip())
    return m.group(1).strip() if m else text.strip()


def _print_header(label: str, backend: str) -> None:
    if label:
        print(f'\n[{backend}] generating: {label}')
    print(f'[{backend}] ' + '-' * 60)


# ── Claude CLI helpers ─────────────────────────────────────────────────────

def _npm_global_bin() -> str | None:
    try:
        result = subprocess.run(
            'npm bin -g', capture_output=True, text=True, shell=True
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return None


def _find_claude_exe() -> str:
    found = shutil.which('claude') or shutil.which('claude.cmd')
    if found:
        return found
    npm_bin = _npm_global_bin()
    if npm_bin:
        for name in ('claude.cmd', 'claude'):
            candidate = Path(npm_bin) / name
            if candidate.exists():
                return str(candidate)
    if _IS_WINDOWS:
        appdata = os.environ.get('APPDATA', '')
        if appdata:
            for name in ('claude.cmd', 'claude'):
                candidate = Path(appdata) / 'npm' / name
                if candidate.exists():
                    return str(candidate)
    return 'claude'


# ══════════════════════════════════════════════════════════════════════════
# Backend 1 — Anthropic API (streaming)
# ══════════════════════════════════════════════════════════════════════════

class LLMClient:
    """
    Calls Claude via the Anthropic Python SDK.
    Requires ANTHROPIC_API_KEY in automation/generator/.env
    """

    def __init__(self, model: str = ANTHROPIC_MODEL):
        try:
            import anthropic as _anthropic
        except ImportError:
            raise ImportError('anthropic package not installed. Run: pip install anthropic')
        api_key = os.environ.get('ANTHROPIC_API_KEY')
        if not api_key:
            raise EnvironmentError(
                'ANTHROPIC_API_KEY is not set. Add it to automation/generator/.env'
            )
        self._anthropic = _anthropic
        self.client = _anthropic.Anthropic(api_key=api_key)
        self.model  = model

    def generate(self, system: str, user: str, label: str = '') -> str:
        _print_header(label, 'anthropic')
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
        print(f'\n[anthropic] ' + '-' * 60)
        return _strip_fences(''.join(chunks))


# ══════════════════════════════════════════════════════════════════════════
# Backend 2 — Claude Code CLI (subprocess)
# ══════════════════════════════════════════════════════════════════════════

class SDKClient:
    """
    Calls Claude via the `claude` CLI tool (Claude Code).
    No ANTHROPIC_API_KEY needed — uses your Claude Code subscription.
    Requires `claude` to be on PATH:  npm install -g @anthropic-ai/claude-code
    """

    def __init__(self, model: str = ANTHROPIC_MODEL):
        self.model = model
        self._claude_exe = _find_claude_exe()
        self._check_claude_available()

    def _check_claude_available(self) -> None:
        try:
            result = subprocess.run(
                f'"{self._claude_exe}" --version',
                capture_output=True, text=True, shell=True,
            )
        except Exception as exc:
            raise EnvironmentError(
                '`claude` CLI not found. Install: npm install -g @anthropic-ai/claude-code'
            ) from exc
        if result.returncode != 0:
            raise EnvironmentError(
                f'`claude` CLI not found on PATH.\n'
                f'Install: npm install -g @anthropic-ai/claude-code\n'
                f'Looked for: {self._claude_exe}\n'
                f'stderr: {result.stderr.strip()}'
            )

    def generate(self, system: str, user: str, label: str = '') -> str:
        _print_header(label, 'sdk')
        combined = f'{system}\n\n{"─" * 60}\n\n{user}'
        if _IS_WINDOWS:
            cmd: str | list = f'"{self._claude_exe}" --print --model {self.model}'
            use_shell = True
        else:
            cmd = [self._claude_exe, '--print', '--model', self.model]
            use_shell = False
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, encoding='utf-8', shell=use_shell,
        )
        stdout_data, stderr_data = process.communicate(input=combined)
        print(stdout_data, end='', flush=True)
        if process.returncode != 0:
            raise RuntimeError(f'claude CLI failed (exit {process.returncode}): {stderr_data.strip()}')
        print(f'\n[sdk] ' + '-' * 60)
        return _strip_fences(stdout_data)


# ══════════════════════════════════════════════════════════════════════════
# Backend 3 — Google Gemini API
# ══════════════════════════════════════════════════════════════════════════

class GeminiClient:
    """
    Calls Gemini via the Google Generative AI Python SDK.
    Requires in automation/generator/.env:
      GEMINI_API_KEY=<your key>
      GEMINI_MODEL=gemini-2.0-flash   (optional, overrides default)

    Install:  pip install google-generativeai
    """

    def __init__(self, model: str = GEMINI_MODEL):
        try:
            import google.generativeai as genai
        except ImportError:
            raise ImportError(
                'google-generativeai package not installed. '
                'Run: pip install google-generativeai'
            )
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            raise EnvironmentError(
                'GEMINI_API_KEY is not set. Add it to automation/generator/.env'
            )
        genai.configure(api_key=api_key)
        self._genai = genai
        self.model_name = os.environ.get('GEMINI_MODEL', model)

    def generate(self, system: str, user: str, label: str = '') -> str:
        _print_header(label, 'gemini')
        model = self._genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=system,
        )
        response = model.generate_content(
            user,
            generation_config=self._genai.types.GenerationConfig(
                max_output_tokens=MAX_TOKENS,
            ),
            stream=True,
        )
        chunks: list[str] = []
        for chunk in response:
            text = chunk.text or ''
            print(text, end='', flush=True)
            chunks.append(text)
        print(f'\n[gemini] ' + '-' * 60)
        return _strip_fences(''.join(chunks))


# ══════════════════════════════════════════════════════════════════════════
# Backend 4 — Google Vertex AI
# ══════════════════════════════════════════════════════════════════════════

class VertexAIClient:
    """
    Calls Gemini via Google Vertex AI.
    Requires in automation/generator/.env:
      GCP_CREDENTIALS_PATH=gcp_credential_2026.json   (filename inside generator/)
      GCP_PROJECT=your-gcp-project-id
      GCP_LOCATION=us-central1                        (optional, default: us-central1)
      VERTEX_MODEL=gemini-2.0-flash                   (optional, overrides default)

    The credentials file must be a GCP service account JSON key.
    Place it in automation/generator/ alongside .env.

    Install:  pip install google-cloud-aiplatform
    """

    def __init__(self, model: str = VERTEX_MODEL):
        try:
            import vertexai
            from vertexai.generative_models import GenerativeModel, GenerationConfig
        except ImportError:
            raise ImportError(
                'google-cloud-aiplatform package not installed. '
                'Run: pip install google-cloud-aiplatform'
            )

        cred_filename = os.environ.get('GCP_CREDENTIALS_PATH')
        if not cred_filename:
            raise EnvironmentError(
                'GCP_CREDENTIALS_PATH is not set. '
                'Add the credentials filename to automation/generator/.env\n'
                'Example:  GCP_CREDENTIALS_PATH=gcp_credential_2026.json'
            )
        # Resolve relative paths relative to the generator directory
        cred_path = Path(cred_filename)
        if not cred_path.is_absolute():
            cred_path = Path(__file__).parent / cred_path
        if not cred_path.exists():
            raise FileNotFoundError(
                f'GCP credentials file not found: {cred_path}\n'
                f'Place your service account JSON in automation/generator/ '
                f'and set GCP_CREDENTIALS_PATH in .env'
            )

        project = os.environ.get('GCP_PROJECT')
        if not project:
            raise EnvironmentError(
                'GCP_PROJECT is not set. Add your GCP project ID to automation/generator/.env'
            )
        location = os.environ.get('GCP_LOCATION', 'us-central1')
        self.model_name = os.environ.get('VERTEX_MODEL', model)

        try:
            from google.oauth2 import service_account
        except ImportError:
            raise ImportError(
                'google-auth package not installed. '
                'Run: pip install google-auth'
            )

        credentials = service_account.Credentials.from_service_account_file(
            str(cred_path),
            scopes=['https://www.googleapis.com/auth/cloud-platform'],
        )
        vertexai.init(project=project, location=location, credentials=credentials)
        self._GenerativeModel = GenerativeModel
        self._GenerationConfig = GenerationConfig

    def generate(self, system: str, user: str, label: str = '') -> str:
        _print_header(label, 'vertexai')
        model = self._GenerativeModel(
            model_name=self.model_name,
            system_instruction=[system],
        )
        responses = model.generate_content(
            [user],
            generation_config=self._GenerationConfig(max_output_tokens=MAX_TOKENS),
            stream=True,
        )
        chunks: list[str] = []
        for chunk in responses:
            text = chunk.text or ''
            print(text, end='', flush=True)
            chunks.append(text)
        print(f'\n[vertexai] ' + '-' * 60)
        return _strip_fences(''.join(chunks))


# ══════════════════════════════════════════════════════════════════════════
# Factory
# ══════════════════════════════════════════════════════════════════════════

_PROVIDERS = ('anthropic', 'sdk', 'gemini', 'vertexai')


def create_client(
    provider: str = 'anthropic',
    model: str | None = None,
) -> LLMClient | SDKClient | GeminiClient | VertexAIClient:
    """
    Return the appropriate client for the given provider name.

    provider='anthropic'  →  LLMClient       (Anthropic API, ANTHROPIC_API_KEY)
    provider='sdk'        →  SDKClient        (claude CLI, Claude Code subscription)
    provider='gemini'     →  GeminiClient     (Gemini API, GEMINI_API_KEY)
    provider='vertexai'   →  VertexAIClient   (Vertex AI, GCP service account)
    """
    provider = provider.lower().strip()
    print(f'[client] provider: {provider}')

    if provider == 'anthropic':
        return LLMClient(model=model or ANTHROPIC_MODEL)
    if provider == 'sdk':
        return SDKClient(model=model or ANTHROPIC_MODEL)
    if provider == 'gemini':
        return GeminiClient(model=model or GEMINI_MODEL)
    if provider == 'vertexai':
        return VertexAIClient(model=model or VERTEX_MODEL)

    raise ValueError(
        f'Unknown provider {provider!r}. Choose from: {", ".join(_PROVIDERS)}'
    )
