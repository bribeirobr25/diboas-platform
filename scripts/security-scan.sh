#!/usr/bin/env bash
# Periodic security scan runner for the diBoaS platform.
#
# Usage:
#   bash scripts/security-scan.sh                 # Local dependency + secrets + linting
#   bash scripts/security-scan.sh --live          # Adds DNS / TLS / HTTP header scans against diboas.com
#   bash scripts/security-scan.sh --live --full   # Adds OWASP ZAP + Nuclei + testssl.sh if installed
#
# Cadence: run quarterly, or after any major dependency / infrastructure change.
# All scans are read-only (passive recon + tool invocations); no state changes.
#
# Findings ledger: docs/audit/SECURITY_FINDINGS_2026-05.md (gitignored, update manually)
# Playbook: docs/tech/security-playbook.md

set -eo pipefail

# -------- arg parsing --------
LIVE=false
FULL=false
TARGET="diboas.com"

for arg in "$@"; do
  case "$arg" in
    --live) LIVE=true ;;
    --full) FULL=true; LIVE=true ;;
    --target=*) TARGET="${arg#*=}" ;;
    -h|--help)
      sed -n '1,/^set -eo pipefail$/p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
  esac
done

# -------- helpers --------
say() { printf "\n\033[1;36m=== %s ===\033[0m\n" "$1"; }
warn() { printf "\033[1;33m! %s\033[0m\n" "$1"; }
ok() { printf "\033[1;32m✓ %s\033[0m\n" "$1"; }
err() { printf "\033[1;31m✗ %s\033[0m\n" "$1" >&2; }

require_or_skip() {
  command -v "$1" >/dev/null 2>&1 || { warn "$1 not installed — skipping ($2)"; return 1; }
}

# -------- Phase 1: local — always runs --------

say "Phase 1.1 — Dependency vulnerability audit (pnpm)"
if pnpm audit --prod --audit-level=high 2>/dev/null; then
  ok "No HIGH/CRITICAL dependency vulnerabilities"
else
  warn "Dependency vulnerabilities found — review output above"
fi

say "Phase 1.2 — Secrets full-history scan (gitleaks)"
if command -v gitleaks >/dev/null 2>&1; then
  # Show FULL gitleaks output — every finding deserves visibility, not just the tail.
  # The allowlist in .gitleaks.toml is the right place to suppress known-benign matches,
  # not output truncation.
  if pnpm run secrets:scan; then
    ok "Secrets scan: no findings outside allowlist"
  else
    warn "Secrets scan reported findings (above) — verify each against .gitleaks.toml allowlist before treating as new"
  fi
else
  warn "gitleaks not installed (brew install gitleaks); skipping full-history scan"
fi

say "Phase 1.3 — Type + lint gates"
# Show full output so errors are diagnosable when this script runs interactively.
# Suppressing with >/dev/null hides the line numbers the user needs to fix the issue.
if pnpm type-check; then
  ok "type-check clean"
else
  err "type-check failures (see output above)"
fi
if pnpm lint; then
  ok "lint clean"
else
  err "lint failures (see output above)"
fi

say "Phase 1.4 — Bundle budget"
if pnpm check:budget; then
  ok "bundle within budget"
else
  warn "bundle budget exceeded (see output above)"
fi

# -------- Phase 2: live scans (opt-in via --live) --------

if ! $LIVE; then
  say "Skipping live scans (pass --live to enable)"
  exit 0
fi

say "Phase 2.1 — DNS audit ($TARGET)"

A=$(dig +short A "$TARGET" 2>/dev/null | tr '\n' ' ')
AAAA=$(dig +short AAAA "$TARGET" 2>/dev/null | tr '\n' ' ')
MX=$(dig +short MX "$TARGET" 2>/dev/null | head -3 | tr '\n' '/')
SPF=$(dig +short TXT "$TARGET" 2>/dev/null | grep -i 'spf' | head -1)
DMARC=$(dig +short TXT "_dmarc.$TARGET" 2>/dev/null | head -1)
CAA=$(dig +short CAA "$TARGET" 2>/dev/null | head -3 | tr '\n' '/')

echo "  A:     $A"
echo "  AAAA:  ${AAAA:-(none)}"
echo "  MX:    $MX"
echo "  SPF:   $SPF"
echo "  DMARC: $DMARC"
echo "  CAA:   ${CAA:-(none)  ⚠  no cert-issuance restriction (F5)}"

case "$DMARC" in
  *p=none*) warn "DMARC is p=none — monitor-only, no enforcement (F1)" ;;
  *p=quarantine*) warn "DMARC is p=quarantine — partial enforcement; tighten to p=reject when ready" ;;
  *p=reject*) ok "DMARC is p=reject — full enforcement" ;;
  "") err "No DMARC record published — high spoofing risk" ;;
esac

say "Phase 2.2 — TLS configuration"
TLS_VER=$(echo "Q" | openssl s_client -connect "$TARGET:443" -servername "$TARGET" 2>/dev/null | grep -E "^    Protocol" | awk -F: '{print $2}' | xargs)
TLS_CIPHER=$(echo "Q" | openssl s_client -connect "$TARGET:443" -servername "$TARGET" 2>/dev/null | grep -E "^    Cipher" | awk -F: '{print $2}' | xargs)
echo "  Protocol: $TLS_VER"
echo "  Cipher:   $TLS_CIPHER"

# Reject old protocols
for proto in tls1 tls1_1; do
  if echo "Q" | openssl s_client -connect "$TARGET:443" -servername "$TARGET" -$proto 2>&1 | grep -q "Cipher.*0000\|handshake failure\|sslv3 alert"; then
    ok "$proto rejected"
  else
    err "$proto ACCEPTED — should be rejected"
  fi
done

say "Phase 2.3 — HTTP security header grading"
HEADERS=$(curl -sI -H "User-Agent: diBoaS-security-scan/1.0" "https://$TARGET/api/health" 2>/dev/null)
for h in "strict-transport-security" "x-content-type-options" "x-frame-options" "referrer-policy" "permissions-policy" "content-security-policy"; do
  if echo "$HEADERS" | grep -qi "^$h:"; then
    ok "$h: present"
  else
    err "$h: MISSING"
  fi
done

say "Phase 2.4 — Subdomain enumeration via crt.sh (Certificate Transparency)"
SUBS=$(curl -s "https://crt.sh/?q=%25.$TARGET&output=json" 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
seen = set()
for entry in data:
    for name in entry.get('name_value', '').split('\\n'):
        name = name.strip().lower()
        if name and '$TARGET' in name and not name.startswith('*'):
            seen.add(name)
for s in sorted(seen):
    print(s)
" 2>/dev/null)
SUB_COUNT=$(echo "$SUBS" | wc -l | xargs)
echo "  $SUB_COUNT distinct subdomains in CT logs"
echo "$SUBS" | head -20 | sed 's/^/    /'
[ "$SUB_COUNT" -gt 20 ] && echo "    ...(truncated, $((SUB_COUNT - 20)) more)"

say "Phase 2.5 — Well-known + standard endpoint discovery"
for path in /robots.txt /sitemap.xml /.well-known/security.txt /humans.txt /.env /package.json /.git/config /server-status; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -H "User-Agent: diBoaS-security-scan/1.0" "https://$TARGET$path")
  case "$code" in
    200) echo "  $path → 200" ;;
    307|308|301|302) echo "  $path → $code (redirect — likely Next.js i18n catchall, verify content if surprising)" ;;
    404) ;;  # silent — expected
    *) echo "  $path → $code" ;;
  esac
done

say "Phase 2.6 — Mozilla Observatory v2 grade"
RESULT=$(curl -s -X POST "https://observatory-api.mdn.allizom.org/api/v2/scan?host=$TARGET" -H "Content-Type: application/json" 2>/dev/null)
echo "$RESULT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    grade = d.get('grade', '?')
    score = d.get('score', '?')
    print(f'  Grade: {grade}  Score: {score}')
    if grade in ('F', 'D', 'C'):
        print('  ! Low grade — see https://developer.mozilla.org/en-US/observatory/analyze?host=$TARGET')
except: print('  (parse error)')
"

# -------- Phase 3: --full only --------

if ! $FULL; then
  say "Skipping full scans (pass --full for OWASP ZAP / Nuclei / testssl.sh)"
  say "Done. Update docs/audit/SECURITY_FINDINGS_2026-05.md with any new findings."
  exit 0
fi

say "Phase 3.1 — testssl.sh deep TLS audit"
if require_or_skip testssl.sh "deep TLS analysis"; then
  testssl.sh --quiet --color 0 "https://$TARGET" | tail -50
fi

say "Phase 3.2 — Nuclei template-based vuln scan"
if require_or_skip nuclei "template-based vuln scanning"; then
  nuclei -u "https://$TARGET" -severity critical,high -silent -rate-limit 10 -timeout 5 -no-color | head -30
fi

say "Phase 3.3 — OWASP ZAP baseline scan (Docker)"
if require_or_skip docker "ZAP baseline scan"; then
  echo "  Running ZAP baseline (this takes 5-10 min)..."
  docker run --rm -t zaproxy/zap-stable zap-baseline.py -t "https://$TARGET" 2>&1 | tail -30 || warn "ZAP scan reported findings — review output"
fi

say "Phase 3.4 — Semgrep SAST (source code analysis)"
if require_or_skip semgrep "static analysis"; then
  semgrep --config=auto --severity=ERROR --severity=WARNING apps/web/src --no-error 2>&1 | tail -30
fi

say "Done. Update docs/audit/SECURITY_FINDINGS_2026-05.md with any new findings."
