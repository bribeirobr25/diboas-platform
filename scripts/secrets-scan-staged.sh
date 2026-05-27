#!/usr/bin/env bash
# Local pre-commit secrets scanner — runs gitleaks against staged files only.
#
# Behaviour:
#   - If gitleaks is installed → scan staged diff. Block commit on any finding.
#   - If gitleaks is NOT installed → print a noisy one-time warning and exit 0
#     (do NOT block the commit). The CI gate in .github/workflows/security.yml
#     is the authoritative check; the local hook is best-effort.
#
# Why not hard-fail when gitleaks is missing? Because contributors who can't
# install gitleaks (e.g. CI bots, transient environments, contractors on
# restricted machines) would otherwise be blocked from committing at all, and
# would just bypass with `--no-verify`. A nagging warning is more effective.
#
# To install gitleaks:
#   macOS:  brew install gitleaks
#   Linux:  https://github.com/gitleaks/gitleaks/releases (binary download)
#   Docker: docker pull zricethezav/gitleaks:latest

set -e

if ! command -v gitleaks >/dev/null 2>&1; then
  cat <<'EOF' >&2

  ⚠  gitleaks is not installed — secrets pre-commit scan SKIPPED.

      CI will still scan this commit when it lands in a PR.
      To enable local scanning before push:

        macOS:  brew install gitleaks
        Linux:  https://github.com/gitleaks/gitleaks/releases

      Config lives in .gitleaks.toml at the repo root.

EOF
  exit 0
fi

# Run gitleaks against the staged index.
#   --staged       only diff what's about to be committed
#   --redact       don't print the secret value in the log; print the file:line and rule
#   --verbose      show the rule that matched
#   --no-banner    quieter output
#   --config       explicit config path (avoid any ambiguity)
exec gitleaks protect \
  --staged \
  --redact \
  --verbose \
  --no-banner \
  --config="$(git rev-parse --show-toplevel)/.gitleaks.toml"
