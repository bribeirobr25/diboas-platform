#!/bin/bash
# ==========================================================================
# diBoaS Pre-Launch Comprehensive Audit Script
# ==========================================================================
#
# Purpose: Run comprehensive checks before deployment to ensure code quality,
#          security, and compliance with project standards.
#
# Usage:
#   ./scripts/pre-launch-audit.sh          # Interactive mode (full output)
#   ./scripts/pre-launch-audit.sh --ci     # CI mode (exits non-zero on critical issues)
#
# Aligned with diBoaS 12 Principles of Excellence:
#   - Security & Audit Standards
#   - Error Handling & System Recovery
#   - Performance & SEO Optimization
#   - Monitoring & Observability
# ==========================================================================

# Use project root reliably
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# Track errors for CI mode
CRITICAL_ERRORS=0
WARNINGS=0

# CI mode flag
CI_MODE=false
if [ "$1" = "--ci" ]; then
  CI_MODE=true
fi

# Helper function for section headers
print_section() {
  echo ""
  echo "=========================================="
  echo "$1"
  echo "=========================================="
}

# Helper function for check headers
print_check() {
  echo ""
  echo "--- $1 ---"
}

print_section "diBoaS PRE-LAUNCH COMPREHENSIVE AUDIT"
echo "Project: $PROJECT_ROOT"
echo "Mode: $([ "$CI_MODE" = true ] && echo 'CI (strict)' || echo 'Interactive')"
echo "Date: $(date)"

# ==========================================================================
# CHECK 1: TypeScript Type Checking
# ==========================================================================
print_check "1/15: TypeScript Type Checking"
if pnpm run type-check; then
  echo "OK: Type check passed"
else
  echo "FAIL: Type check failed"
  ((CRITICAL_ERRORS++)) || true
fi

# ==========================================================================
# CHECK 2: TypeScript Strict Mode Check (informational)
# ==========================================================================
print_check "2/15: TypeScript Strict Mode Check (informational)"
echo "Note: This check is informational - strict mode may not be fully enabled"
STRICT_ERRORS=$(cd apps/web && npx tsc --noEmit --strict 2>&1 | grep -c "error TS" || true)
echo "Strict mode errors: $STRICT_ERRORS"
if [ "$STRICT_ERRORS" -gt 0 ]; then
  echo "(Run 'cd apps/web && npx tsc --noEmit --strict' for details)"
  ((WARNINGS++)) || true
fi

# ==========================================================================
# CHECK 3: Security Vulnerabilities
# ==========================================================================
print_check "3/15: Security Vulnerabilities (pnpm audit)"
if pnpm audit; then
  echo "OK: No known vulnerabilities"
else
  echo "FAIL: Security vulnerabilities found"
  ((CRITICAL_ERRORS++)) || true
fi

# ==========================================================================
# CHECK 4: ESLint Linting
# ==========================================================================
print_check "4/15: ESLint Linting"
LINT_RESULT=$(pnpm run lint 2>&1) || true
LINT_ERRORS=$(echo "$LINT_RESULT" | grep -c "error" || true)
LINT_WARNINGS=$(echo "$LINT_RESULT" | grep -c "warning" || true)
echo "Lint errors: $LINT_ERRORS, warnings: $LINT_WARNINGS"
if [ "$LINT_ERRORS" -gt 0 ]; then
  echo "FAIL: ESLint errors found"
  echo "$LINT_RESULT" | tail -30
  ((CRITICAL_ERRORS++)) || true
else
  echo "OK: No critical lint errors"
fi

# ==========================================================================
# CHECK 5: Unused Dependencies
# ==========================================================================
print_check "5/15: Unused Dependencies"
echo "Checking apps/web..."
(cd apps/web && npx depcheck 2>/dev/null) || echo "depcheck not available or found issues"

# ==========================================================================
# CHECK 6: Outdated Dependencies
# ==========================================================================
print_check "6/15: Outdated Dependencies"
OUTDATED=$(pnpm outdated 2>/dev/null | wc -l || true)
if [ "$OUTDATED" -gt 2 ]; then
  echo "Outdated packages found:"
  pnpm outdated 2>/dev/null | head -20
  ((WARNINGS++)) || true
else
  echo "OK: Dependencies are up to date"
fi

# ==========================================================================
# CHECK 7: Console.log Statements
# ==========================================================================
print_check "7/15: Console.log Statements"
CONSOLE_COUNT=$(grep -rl "console\.log" --include="*.ts" --include="*.tsx" apps/web/src 2>/dev/null | wc -l | tr -d ' ')
echo "Files with console.log: $CONSOLE_COUNT"
if [ "$CONSOLE_COUNT" -gt 0 ]; then
  echo "Locations (first 15):"
  grep -rn "console\.log" --include="*.ts" --include="*.tsx" apps/web/src 2>/dev/null | head -15
  ((WARNINGS++)) || true
else
  echo "OK: No console.log statements found"
fi

# ==========================================================================
# CHECK 8: TODO Comments
# ==========================================================================
print_check "8/15: TODO/FIXME Comments"
TODO_COUNT=$(grep -rE "TODO|FIXME|HACK|XXX" --include="*.ts" --include="*.tsx" apps/web/src 2>/dev/null | wc -l | tr -d ' ')
echo "TODO/FIXME comments found: $TODO_COUNT"
if [ "$TODO_COUNT" -gt 0 ]; then
  grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.tsx" apps/web/src 2>/dev/null | head -20
  ((WARNINGS++)) || true
fi

# ==========================================================================
# CHECK 9: 'any' Type Usage
# ==========================================================================
print_check "9/15: 'any' Type Usage"
ANY_COUNT=$(grep -rl ": any" --include="*.ts" --include="*.tsx" apps/web/src 2>/dev/null | wc -l | tr -d ' ')
echo "Files with 'any' type: $ANY_COUNT"
if [ "$ANY_COUNT" -gt 10 ]; then
  echo "High 'any' usage detected. Review recommended."
  grep -rn ": any" --include="*.ts" --include="*.tsx" apps/web/src 2>/dev/null | head -20
  ((WARNINGS++)) || true
else
  echo "OK: 'any' usage is within acceptable limits"
fi

# ==========================================================================
# CHECK 10: Hardcoded Secrets Scan
# ==========================================================================
print_check "10/15: Hardcoded Secrets Scan"
SECRET_PATTERNS="(api[_-]?key|password|secret|token|private[_-]?key|apikey|api_secret)\s*[:=]\s*['\"][^'\"]{8,}['\"]"
SECRETS_FOUND=$(grep -rE "$SECRET_PATTERNS" --include="*.ts" --include="*.tsx" --include="*.js" apps/web/src 2>/dev/null | grep -v "process\.env" | wc -l | tr -d ' ')
if [ "$SECRETS_FOUND" -gt 0 ]; then
  echo "POTENTIAL SECRETS FOUND - REVIEW IMMEDIATELY:"
  grep -rn "$SECRET_PATTERNS" --include="*.ts" --include="*.tsx" --include="*.js" apps/web/src 2>/dev/null | grep -v "process\.env"
  ((CRITICAL_ERRORS++)) || true
else
  echo "OK: No obvious hardcoded secrets detected"
fi

# ==========================================================================
# CHECK 11: Dead Code Detection
# ==========================================================================
print_check "11/15: Dead Code Detection (unused exports)"
if command -v ts-prune &> /dev/null; then
  UNUSED_EXPORTS=$(npx ts-prune apps/web/src 2>/dev/null | head -30)
  if [ -n "$UNUSED_EXPORTS" ]; then
    echo "Potentially unused exports (first 30):"
    echo "$UNUSED_EXPORTS"
    ((WARNINGS++)) || true
  else
    echo "OK: No unused exports detected"
  fi
else
  echo "SKIP: ts-prune not installed (npm i -g ts-prune)"
fi

# ==========================================================================
# CHECK 12: License Compliance
# ==========================================================================
print_check "12/15: License Compliance Check"
if command -v license-checker &> /dev/null; then
  npx license-checker --summary 2>/dev/null || echo "Could not run license check"
else
  echo "SKIP: license-checker not installed (npm i -g license-checker)"
fi

# ==========================================================================
# CHECK 13: API Routes Security Check
# ==========================================================================
print_check "13/15: API Routes Security Check"
echo "API routes found:"
API_ROUTES=$(find apps/web/src/app/api -name "route.ts" 2>/dev/null)
echo "$API_ROUTES" | wc -l | tr -d ' '
echo ""
echo "Checking rate limiting coverage..."
UNPROTECTED_ROUTES=0
for route in $API_ROUTES; do
  if ! grep -qE "ratelimit|RateLimit|@upstash/ratelimit" "$route"; then
    echo "  Missing rate limit: $route"
    ((UNPROTECTED_ROUTES++)) || true
  fi
done
if [ "$UNPROTECTED_ROUTES" -gt 0 ]; then
  echo "WARN: $UNPROTECTED_ROUTES API routes without rate limiting"
  ((WARNINGS++)) || true
else
  echo "OK: All API routes have rate limiting"
fi

# ==========================================================================
# CHECK 14: Environment Variables Check
# ==========================================================================
print_check "14/15: Environment Variables Check"
if [ -f "apps/web/.env.example" ]; then
  ENV_USED=$(grep -ohE 'process\.env\.[A-Z_]+' -r apps/web/src --include="*.ts" --include="*.tsx" 2>/dev/null | sed 's/process\.env\.//' | sort | uniq)
  ENV_DOCUMENTED=$(grep -oE '^[A-Z_]+' apps/web/.env.example 2>/dev/null | sort | uniq)

  MISSING_DOCS=$(comm -23 <(echo "$ENV_USED") <(echo "$ENV_DOCUMENTED") 2>/dev/null)
  if [ -n "$MISSING_DOCS" ]; then
    echo "Env vars used but not in .env.example:"
    echo "$MISSING_DOCS"
    ((WARNINGS++)) || true
  else
    echo "OK: All env vars documented in .env.example"
  fi
else
  echo "WARN: No .env.example file found"
  ((WARNINGS++)) || true
fi

# ==========================================================================
# CHECK 15: Bundle Size Analysis
# ==========================================================================
print_check "15/15: Bundle Size Analysis"
echo "Run manually for full analysis:"
echo "  cd apps/web && ANALYZE=true pnpm build"
echo ""
if [ -d "apps/web/.next" ]; then
  echo "Current .next directory size:"
  du -sh apps/web/.next 2>/dev/null || echo "Could not determine size"
fi

# ==========================================================================
# SUMMARY
# ==========================================================================
print_section "AUDIT SUMMARY"

echo ""
echo "Results:"
echo "  Critical Errors: $CRITICAL_ERRORS"
echo "  Warnings: $WARNINGS"
echo ""

if [ "$CRITICAL_ERRORS" -gt 0 ]; then
  echo "CRITICAL ISSUES REQUIRE ATTENTION:"
  echo "  1. Fix TypeScript errors"
  echo "  2. Address security vulnerabilities"
  echo "  3. Fix ESLint errors"
  echo "  4. Remove any hardcoded secrets"
  echo ""
fi

if [ "$WARNINGS" -gt 0 ]; then
  echo "WARNINGS TO REVIEW:"
  echo "  - Remove console.log statements (use Logger instead)"
  echo "  - Address TODO comments or document for post-launch"
  echo "  - Replace 'any' types with proper types"
  echo "  - Ensure all API routes have rate limiting"
  echo "  - Document all required environment variables"
  echo "  - Update outdated dependencies"
  echo ""
fi

# Exit with error code in CI mode if critical errors found
if [ "$CI_MODE" = true ] && [ "$CRITICAL_ERRORS" -gt 0 ]; then
  echo "CI MODE: Failing due to $CRITICAL_ERRORS critical error(s)"
  exit 1
fi

if [ "$CRITICAL_ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo "ALL CHECKS PASSED - Ready for deployment!"
fi

echo ""
echo "Audit completed at $(date)"
