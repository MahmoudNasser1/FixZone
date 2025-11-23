#!/bin/bash
# 🔔 Notifications API Test (Cookie-based auth, non-interactive)

set -euo pipefail

BASE_URL="http://localhost:4000"
COOKIE_JAR="/tmp/fixzone_notifications_cookie.jar"
RESULTS_FILE="RESULTS/03_NOTIFICATIONS_API_RUN_COOKIE.log"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

mkdir -p RESULTS
rm -f "$COOKIE_JAR" || true
echo "🔔 Notifications API Test (Cookie-based)" | tee "$RESULTS_FILE"
echo "=======================================" | tee -a "$RESULTS_FILE"

LOGIN_ID="${LOGIN_ID:-admin@test.com}"
LOGIN_PW="${LOGIN_PW:-admin123}"

echo -e "🔐 Logging in as: ${YELLOW}${LOGIN_ID}${NC}" | tee -a "$RESULTS_FILE"
LOGIN_STATUS=$(curl -sS -o /tmp/login_resp.json -w "%{http_code}" -c "$COOKIE_JAR" -H "Content-Type: application/json" \
  -X POST "${BASE_URL}/api/auth/login" \
  -d "{\"loginIdentifier\":\"${LOGIN_ID}\",\"password\":\"${LOGIN_PW}\"}")

echo "Login HTTP: $LOGIN_STATUS" | tee -a "$RESULTS_FILE"
if [ "$LOGIN_STATUS" != "200" ]; then
  echo -e "${RED}❌ Login failed${NC}" | tee -a "$RESULTS_FILE"
  cat /tmp/login_resp.json | tee -a "$RESULTS_FILE" || true
  exit 0
fi
echo -e "${GREEN}✅ Login success${NC}" | tee -a "$RESULTS_FILE"

run_test () {
  local title="$1"
  local method="$2"
  local url="$3"
  local data="${4:-}"
  echo "" | tee -a "$RESULTS_FILE"
  echo "📋 ${title}" | tee -a "$RESULTS_FILE"
  if [ -n "$data" ]; then
    STATUS=$(curl -sS -o /tmp/resp.json -w "%{http_code}" -b "$COOKIE_JAR" -H "Content-Type: application/json" -X "$method" "$url" -d "$data")
  else
    STATUS=$(curl -sS -o /tmp/resp.json -w "%{http_code}" -b "$COOKIE_JAR" -H "Content-Type: application/json" -X "$method" "$url")
  fi
  echo "HTTP: $STATUS" | tee -a "$RESULTS_FILE"
  (jq '.' /tmp/resp.json 2>/dev/null || cat /tmp/resp.json) | tee -a "$RESULTS_FILE"
}

# Route order requires count endpoint to work
run_test "GET /api/notifications/unread/count" "GET" "${BASE_URL}/api/notifications/unread/count"

# List notifications
run_test "GET /api/notifications?limit=10" "GET" "${BASE_URL}/api/notifications?limit=10"

# If any notification, mark first as read
FIRST_ID=$(jq -r '.[0].id // empty' /tmp/resp.json 2>/dev/null || true)
if [ -n "$FIRST_ID" ]; then
  run_test "PUT /api/notifications/${FIRST_ID}/read" "PUT" "${BASE_URL}/api/notifications/${FIRST_ID}/read"
fi

# Bulk mark all read
run_test "PUT /api/notifications/mark-all-read" "PUT" "${BASE_URL}/api/notifications/mark-all-read"

# Filters
run_test "GET /api/notifications?isRead=0" "GET" "${BASE_URL}/api/notifications?isRead=0"
run_test "GET /api/notifications?type=system" "GET" "${BASE_URL}/api/notifications?type=system"
run_test "GET /api/notifications?channel=inapp" "GET" "${BASE_URL}/api/notifications?channel=inapp"

echo "" | tee -a "$RESULTS_FILE"
echo -e "${GREEN}✅ Done. Results saved to ${RESULTS_FILE}${NC}" | tee -a "$RESULTS_FILE"


