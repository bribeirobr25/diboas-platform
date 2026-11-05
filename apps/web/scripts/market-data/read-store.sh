#!/usr/bin/env bash
# read-store.sh — a READ-ONLY checkout of the market data store's monthly
# series (diboas-analytics `market/derived/monthly/`), for publish.mjs.
#
#   TOKEN=<read-only token> read-store.sh <dir> [<40-char store commit>]
#
# Used by the weekly refresh (the store's newest commit) and by the PUBLISH-1
# drift check (the commit recorded in store-manifest.json). One script, so the
# drift check also exercises the weekly path.
#
# The token never reaches a URL, `.git/config` or the log: it is sent as an
# HTTP header for each git call, and its encoded form is masked. The checkout
# is sparse (`market/derived/monthly` only) and lives outside the repository.
# A commit given here must be on the store's `main` (the store cannot be
# branch-protected, so a force-push could otherwise point a check at history
# that is no longer the store's).
#
# Prints the commit it checked out on stdout. Exit 1 on any failure.
set -euo pipefail

dir="${1:?usage: read-store.sh <dir> [commit]}"
want="${2:-}"
repo="bribeirobr25/diboas-analytics"
[ -n "${TOKEN:-}" ] || { echo "read-store: no token" >&2; exit 1; }
if [ -n "$want" ] && ! [[ "$want" =~ ^[0-9a-f]{40}$ ]]; then
  echo "read-store: the commit must be a full 40-character sha" >&2
  exit 1
fi

auth="$(printf 'x-access-token:%s' "$TOKEN" | base64 | tr -d '\n')"
[ -n "${GITHUB_ACTIONS:-}" ] && echo "::add-mask::$auth"
g() { git -c http.extraHeader="AUTHORIZATION: basic $auth" "$@"; }

if [ -n "$want" ]; then
  body="$(curl -sS -H "Authorization: Bearer $TOKEN" -H 'Accept: application/vnd.github+json' \
    "https://api.github.com/repos/$repo/compare/$want...main")" ||
    { echo "read-store: GitHub did not answer the compare request" >&2; exit 1; }
  status="$(printf '%s' "$body" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).status||"")}catch{}})')"
  case "$status" in
    ahead | identical) ;;
    *) echo "read-store: $want is not on the store's main (compare: ${status:-none})" >&2; exit 1 ;;
  esac
fi

rm -rf "$dir"
git init -q "$dir"
git -C "$dir" remote add origin "https://github.com/$repo.git"
git -C "$dir" sparse-checkout set market/derived/monthly
g -C "$dir" fetch --quiet --depth 1 --filter=blob:none origin "${want:-main}"
g -C "$dir" checkout --quiet FETCH_HEAD
git -C "$dir" rev-parse HEAD
