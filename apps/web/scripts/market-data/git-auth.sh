# git-auth.sh — authenticate every git call in the CURRENT shell to the store (plan MP-3b).
#
# Sourced, never executed:  TOKEN=<token> source apps/web/scripts/market-data/git-auth.sh
#
# Exports git's header configuration through GIT_CONFIG_* for the rest of the step, so EVERY
# git command and every child process (the commit guard, and git's own on-demand blob fetches
# in a `--filter=blob:none` clone) is authenticated, while the token is never in a URL, on a
# command line or in the clone's .git/config. A per-command wrapper was tried first and left
# `checkout` and `rebase` unauthenticated (review of MP-3b, 2026-11-10). The base64 form is
# masked on Actions before anything can print it.
[ -n "${TOKEN:-}" ] || { echo "git-auth: no token" >&2; return 1 2>/dev/null || exit 1; }
__auth="$(printf 'x-access-token:%s' "$TOKEN" | base64 | tr -d '\n')"
[ -n "${GITHUB_ACTIONS:-}" ] && echo "::add-mask::$__auth"
export GIT_CONFIG_COUNT=1
export GIT_CONFIG_KEY_0=http.extraHeader
export GIT_CONFIG_VALUE_0="AUTHORIZATION: basic $__auth"
unset __auth
