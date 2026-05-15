#!/usr/bin/env python3
# @maintained quake-inventory-system
"""Add a one-line maintainer comment to tracked text/source files (idempotent)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

MARKER = "@maintained quake-inventory-system"
REPO_ROOT = Path(__file__).resolve().parents[1]

SKIP_SUFFIXES = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".woff",
    ".woff2",
    ".bin",
    ".gltf",
    ".pdf",
    ".xlsx",
    ".lock",
    ".webmanifest",
}

SKIP_NAMES = {
    "package-lock.json",
}


def git_tracked_files() -> list[Path]:
    out = subprocess.check_output(
        ["git", "ls-files", "-z"],
        cwd=REPO_ROOT,
        text=False,
    )
    paths: list[Path] = []
    for raw in out.split(b"\0"):
        if not raw:
            continue
        paths.append(REPO_ROOT / raw.decode("utf-8", errors="surrogateescape"))
    return paths


def read_text(path: Path) -> str | None:
    try:
        data = path.read_bytes()
    except OSError:
        return None
    if b"\0" in data[:8192]:
        return None
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        return None


def already_marked(text: str) -> bool:
    return MARKER in text


def _skip_py_docstring(lines: list[str], idx: int) -> int:
    if idx >= len(lines):
        return idx
    stripped = lines[idx].strip()
    for quote in ('"""', "'''"):
        if not stripped.startswith(quote):
            continue
        if stripped.count(quote) >= 2 and len(stripped) > 3:
            return idx + 1
        idx += 1
        while idx < len(lines):
            if quote in lines[idx]:
                return idx + 1
            idx += 1
        return idx
    return idx


def insert_py(text: str, line: str) -> str:
    lines = text.splitlines(keepends=True)
    idx = 0
    if lines and lines[0].startswith("#!"):
        idx = 1
    idx = _skip_py_docstring(lines, idx)
    prefix = line + "\n"
    if idx == 0:
        return prefix + text
    return "".join(lines[:idx]) + prefix + "".join(lines[idx:])


def insert_js_like(text: str, line: str) -> str:
    lines = text.splitlines(keepends=True)
    idx = 0
    while idx < len(lines):
        stripped = lines[idx].strip()
        if stripped in ('"use client";', "'use client';", '"use strict";', "'use strict';"):
            idx += 1
            continue
        if stripped.startswith("//") or stripped == "":
            idx += 1
            continue
        break
    prefix = line + "\n"
    if idx == 0:
        return prefix + text
    return "".join(lines[:idx]) + prefix + "".join(lines[idx:])


def insert_css(text: str, line: str) -> str:
    return f"/* {MARKER} */\n" + text


def insert_md(text: str, line: str) -> str:
    return f"<!-- {MARKER} -->\n" + text


def insert_html(text: str, line: str) -> str:
    return f"<!-- {MARKER} -->\n" + text


def insert_hash(text: str, line: str) -> str:
    return line + "\n" + text


def insert_svg(text: str) -> str:
    comment = f"<!-- {MARKER} -->\n"
    if already_marked(text):
        return text
    stripped = text.lstrip()
    if stripped.startswith("<?xml"):
        end = text.find("?>")
        if end != -1:
            pos = end + 2
            if pos < len(text) and text[pos] == "\n":
                pos += 1
            return text[:pos] + comment + text[pos:]
    return comment + text


def is_hash_comment_file(path: Path) -> bool:
    name = path.name
    if name in {".gitignore", ".dockerignore", ".env.example"}:
        return True
    if name.endswith((".gitignore", ".dockerignore")):
        return True
    return path.suffix.lower() in {
        ".yml",
        ".yaml",
        ".sh",
        ".csv",
        ".txt",
        ".toml",
        ".example",
    }


def insert_json_npm(text: str) -> str | None:
    if MARKER in text:
        return None
    brace = text.find("{")
    if brace == -1:
        return None
    return text[: brace + 1] + f'\n  "//": "{MARKER}",' + text[brace + 1 :]


def apply_marker(path: Path, text: str) -> str | None:
    if already_marked(text):
        return None

    suffix = path.suffix.lower()
    name = path.name

    if name == ".gitkeep":
        return insert_hash(text, f"# {MARKER}")

    if is_hash_comment_file(path):
        return insert_hash(text, f"# {MARKER}")

    if suffix == ".py" or name == "Dockerfile":
        return insert_py(text, f"# {MARKER}")

    if suffix in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}:
        return insert_js_like(text, f"// {MARKER}")

    if suffix == ".css":
        return insert_css(text, "")

    if suffix in {".md", ".mdx"}:
        return insert_md(text, "")

    if suffix in {".html", ".htm"}:
        return insert_html(text, "")

    if suffix == ".svg":
        updated = insert_svg(text)
        return None if updated == text else updated

    if suffix == ".toml":
        return insert_hash(text, f"# {MARKER}")

    if name == "bun.lock":
        return insert_json_npm(text)

    if name == "uv.lock":
        return insert_hash(text, f"# {MARKER}")

    if name == "pnpm-lock.yaml":
        return insert_hash(text, f"# {MARKER}")

    if suffix == ".json" or name.endswith(".webmanifest"):
        return insert_json_npm(text)

    if suffix == "" and name == "Dockerfile":
        return insert_hash(text, f"# {MARKER}")

    return None


def main() -> int:
    changed = 0
    skipped = 0
    errors = 0

    for path in git_tracked_files():
        rel = path.relative_to(REPO_ROOT)
        if path.name in SKIP_NAMES or path.suffix.lower() in SKIP_SUFFIXES:
            skipped += 1
            continue
        if not path.is_file():
            skipped += 1
            continue

        text = read_text(path)
        if text is None:
            skipped += 1
            continue

        updated = apply_marker(path, text)
        if updated is None:
            skipped += 1
            continue

        try:
            path.write_text(updated, encoding="utf-8", newline="")
            changed += 1
            print(f"updated {rel}")
        except OSError as exc:
            errors += 1
            print(f"error {rel}: {exc}", file=sys.stderr)

    print(f"\nDone: {changed} updated, {skipped} skipped, {errors} errors")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
