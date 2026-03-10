"""
generator.py
Generates Playwright test code via one of two backends:

  "api" (default) — Anthropic API, requires ANTHROPIC_API_KEY env var.
  "sdk"           — Claude Agent SDK, uses your local Claude Code subscription.
                    No API key needed.
"""

import asyncio
import anthropic

from test_generator.prompt_builder import build_system_prompt, build_user_prompt


MODEL = "claude-opus-4-6"


# ── Public entry point ────────────────────────────────────────────────────────

def generate_test(test_input: str, verbose: bool = True, mode: str = "api") -> str:
    """
    Generate a Playwright test from a normalised test description.

    Args:
        test_input: Normalised description from input_parser.
        verbose:    Print progress to stdout.
        mode:       "api"  → Anthropic API (needs ANTHROPIC_API_KEY)
                    "sdk"  → Claude Agent SDK (uses Claude Code subscription)

    Returns:
        Raw Python source code string.
    """
    if mode == "sdk":
        return _generate_via_sdk(test_input, verbose)
    return _generate_via_api(test_input, verbose)


# ── API backend ───────────────────────────────────────────────────────────────

def _generate_via_api(test_input: str, verbose: bool) -> str:
    client = anthropic.Anthropic()

    system_prompt = build_system_prompt()
    user_prompt   = build_user_prompt(test_input)

    chunks: list[str] = []

    if verbose:
        print("\n── Generating via API ───────────────────────────────────\n")

    with client.messages.stream(
        model=MODEL,
        max_tokens=4096,
        thinking={"type": "adaptive"},
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    ) as stream:
        for text in stream.text_stream:
            chunks.append(text)
            if verbose:
                print(text, end="", flush=True)

    if verbose:
        print("\n\n── Done ─────────────────────────────────────────────────\n")

    return _extract_code("".join(chunks))


# ── SDK backend ───────────────────────────────────────────────────────────────

def _generate_via_sdk(test_input: str, verbose: bool) -> str:
    """
    Uses the Claude Agent SDK which runs through the local Claude Code CLI.
    No API key required — uses your Claude subscription.
    """
    import importlib.util
    if importlib.util.find_spec("claude_agent_sdk") is None:
        raise ImportError(
            "claude-agent-sdk is not installed.\n"
            "Install it with: pip install claude-agent-sdk"
        )

    system_prompt = build_system_prompt()
    user_prompt   = build_user_prompt(test_input)

    # The SDK takes a single prompt; we combine system + user here.
    full_prompt = f"{system_prompt}\n\n---\n\n{user_prompt}"

    if verbose:
        print("\n── Generating via Claude SDK (subscription) ─────────────\n")

    result_text = asyncio.run(_sdk_query(full_prompt, verbose))

    if verbose:
        print("\n── Done ─────────────────────────────────────────────────\n")

    return _extract_code(result_text)


async def _sdk_query(prompt: str, verbose: bool) -> str:
    from claude_agent_sdk import query, ClaudeAgentOptions, ResultMessage

    result = ""
    async for message in query(
        prompt=prompt,
        options=ClaudeAgentOptions(
            allowed_tools=[],          # no file/shell tools needed
            max_turns=5,
        ),
    ):
        if isinstance(message, ResultMessage):
            result = message.result
            if verbose:
                print(result)
    return result


# ── Shared helper ─────────────────────────────────────────────────────────────

def _extract_code(response: str) -> str:
    """Strip markdown fences (```python ... ```) if present."""
    lines = response.splitlines()

    start = next(
        (i for i, ln in enumerate(lines) if ln.strip().startswith("```")),
        None,
    )
    if start is None:
        return response

    end = next(
        (i for i, ln in enumerate(lines) if i > start and ln.strip() == "```"),
        None,
    )

    if end is None:
        return "\n".join(lines[start + 1:])
    return "\n".join(lines[start + 1:end])
