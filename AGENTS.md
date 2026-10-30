# AGENTS.md — diBoaS platform

For every AI agent working in this repository (Claude Code, Codex, GPT Work and others).

## Start here

- **This repository is public.** Never commit secrets, local file paths, private document
  content or database structure, and never print them in CI output.
- **Private docs are not here.** The register, decisions, domain docs and lane records live in the
  private repository `diboas-docs`, checked out beside this one. Read its `BRAIN.md` first: it is
  the map, and it holds the rules every agent follows. A path such as `docs/audit/X` in a record
  means `audit/X` in `diboas-docs`; only `docs/tech/`, `docs/integrations/` and `docs/testing/`
  live here.
- **Project bootstrap:** `CLAUDE.md` (stack, commands, conventions, the three compliance
  covenants, STOP conditions).

## Who changes what

- **Only Claude Code changes code**, including tests, fixtures, scripts and audit tools, even in
  a disposable copy. Other agents analyse, verify and report; they describe the change they need
  and its acceptance criteria, and Claude Code builds it.
- **The founder merges.** Agents may branch, commit, push and open pull requests; nothing merges
  without the founder.
- Agent-to-agent notes go in the private `diboas-docs` repository (`cc-sync/`, `gpt-sync/`), never
  in this one.
