#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
PRINT_TOKEN=0

usage() {
  echo "Usage: $0 \"Account Name\" owner@example.com \"Owner Full Name\" \"Password\" [--url URL] [--print-token]"
  exit 1
}

# Parse options
while [[ $# -gt 0 ]]; do
  case "$1" in
    --url) BACKEND_URL="$2"; shift 2;;
    --print-token) PRINT_TOKEN=1; shift;;
    --) shift; break;;
    -*) echo "Unknown option: $1"; usage;;
    *) break;;
  esac
done

[[ $# -ge 4 ]] || usage

ACCOUNT_NAME="$1"
OWNER_EMAIL="$2"
OWNER_FULL_NAME="$3"
OWNER_PASSWORD="$4"

# Build JSON payload safely with Python
payload=$(python3 - "$ACCOUNT_NAME" "$OWNER_EMAIL" "$OWNER_FULL_NAME" "$OWNER_PASSWORD" <<'PY'
import json, sys
name, email, full, pw = sys.argv[1:]
print(json.dumps({
  "name": name,
  "owner_email": email,
  "owner_full_name": full,
  "owner_password": pw
}))
PY
)

# Create account
resp=$(curl -sS -f -X POST "$BACKEND_URL/accounts" \
  -H "Content-Type: application/json" \
  -d "$payload")

echo "Account created:"
if command -v jq >/dev/null 2>&1; then
  echo "$resp" | jq
else
  echo "$resp"
fi

# Optionally fetch a token for the new owner
if [[ $PRINT_TOKEN -eq 1 ]]; then
  echo
  echo "Fetching access token for $OWNER_EMAIL..."
  token=$(curl -sS -f -X POST "$BACKEND_URL/auth/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "username=$OWNER_EMAIL" \
    --data-urlencode "password=$OWNER_PASSWORD" \
  | python3 - <<'PY'
import sys, json
print(json.load(sys.stdin)["access_token"])
PY
)
  echo "TOKEN=$token"
fi