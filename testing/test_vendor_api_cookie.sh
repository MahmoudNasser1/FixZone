#!/bin/bash
# 🧾 Vendor Management API Test (Cookie-based, non-interactive)

set -euo pipefail

BASE_URL="http://localhost:4000"
COOKIE_JAR="/tmp/fixzone_vendor_cookie.jar"
RESULTS_FILE="RESULTS/07_VENDOR_MANAGEMENT_API_RUN_COOKIE.log"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

mkdir -p RESULTS
rm -f "$COOKIE_JAR" || true
echo "🧾 Vendor API Test (Cookie-based)" | tee "$RESULTS_FILE"
echo "================================" | tee -a "$RESULTS_FILE"

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

# 1) List vendors
run_test "GET /api/vendors" "GET" "${BASE_URL}/api/vendors"

# 2) Create vendor
TS="$(date +%s)"
NEW_VENDOR_PAYLOAD="{\"name\":\"مورد اختبار ${TS}\",\"email\":\"vendor${TS}@example.com\",\"phone\":\"01012345678\",\"address\":\"عنوان المورد\"}"
run_test "POST /api/vendors (create)" "POST" "${BASE_URL}/api/vendors" "$NEW_VENDOR_PAYLOAD"
NEW_ID=$(jq -r '.id // empty' /tmp/resp.json 2>/dev/null || true)

# 3) Get by id (if created)
if [ -n "$NEW_ID" ]; then
  run_test "GET /api/vendors/${NEW_ID}" "GET" "${BASE_URL}/api/vendors/${NEW_ID}"
fi

# 4) Update vendor (if created)
if [ -n "$NEW_ID" ]; then
  UPDATE_PAYLOAD="{\"name\":\"مورد اختبار محدث ${TS}\",\"phone\":\"01099999990\"}"
  run_test "PUT /api/vendors/${NEW_ID}" "PUT" "${BASE_URL}/api/vendors/${NEW_ID}" "$UPDATE_PAYLOAD"
fi

# 5) Search vendors
run_test "GET /api/vendors?search=اختبار" "GET" "${BASE_URL}/api/vendors?search=%D8%A7%D8%AE%D8%AA%D8%A8%D8%A7%D8%B1"

# 6) Pagination
run_test "GET /api/vendors?page=1&pageSize=5" "GET" "${BASE_URL}/api/vendors?page=1&pageSize=5"

# 7) Delete (soft) (if created)
if [ -n "$NEW_ID" ]; then
  run_test "DELETE /api/vendors/${NEW_ID}" "DELETE" "${BASE_URL}/api/vendors/${NEW_ID}"
fi

# 8) Unauthorized (expect 401)
STATUS=$(curl -sS -o /tmp/resp.json -w "%{http_code}" -H "Content-Type: application/json" -X "GET" "${BASE_URL}/api/vendors")
echo "" | tee -a "$RESULTS_FILE"
echo "📋 GET /api/vendors without auth (expect 401)" | tee -a "$RESULTS_FILE"
echo "HTTP: $STATUS" | tee -a "$RESULTS_FILE"
(jq '.' /tmp/resp.json 2>/dev/null || cat /tmp/resp.json) | tee -a "$RESULTS_FILE"

echo "" | tee -a "$RESULTS_FILE"
echo -e "${GREEN}✅ Done. Results saved to ${RESULTS_FILE}${NC}" | tee -a "$RESULTS_FILE"


