#!/bin/bash
# 🔧 Company API Test (Cookie-based auth, non-interactive)
# Uses httpOnly cookie via login → cookie-jar for subsequent requests

set -euo pipefail

BASE_URL="http://localhost:4000"
COOKIE_JAR="/tmp/fixzone_company_cookie.jar"
RESULTS_FILE="RESULTS/06_COMPANY_MANAGEMENT_API_RUN_COOKIE.log"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

mkdir -p RESULTS
rm -f "$COOKIE_JAR" || true
echo "🏢 Company API Test (Cookie-based)" | tee "$RESULTS_FILE"
echo "==================================" | tee -a "$RESULTS_FILE"

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

# Test 1: GET /api/companies (list)
run_test "GET /api/companies (list)" "GET" "${BASE_URL}/api/companies"

# Test 2: POST /api/companies (create minimal)
TS="$(date +%s)"
NEW_COMPANY_PAYLOAD="{\"name\":\"شركة اختبار ${TS}\",\"email\":\"test${TS}@company.com\",\"phone\":\"01000000000\",\"address\":\"عنوان\",\"taxNumber\":\"TAX${TS}\",\"status\":\"active\"}"
run_test "POST /api/companies (create)" "POST" "${BASE_URL}/api/companies" "$NEW_COMPANY_PAYLOAD"

# Extract created ID if any
NEW_ID=$(jq -r '.id // empty' /tmp/resp.json 2>/dev/null || true)

# Test 3: PUT /api/companies/:id (update) if created
if [ -n "$NEW_ID" ]; then
  UPDATE_PAYLOAD="{\"name\":\"شركة اختبار محدثة ${TS}\",\"phone\":\"01099999999\",\"address\":\"عنوان محدث\"}"
  run_test "PUT /api/companies/${NEW_ID}" "PUT" "${BASE_URL}/api/companies/${NEW_ID}" "$UPDATE_PAYLOAD"
fi

# Test 4: Pagination
run_test "GET /api/companies?page=1&pageSize=5" "GET" "${BASE_URL}/api/companies?page=1&pageSize=5"

# Test 5: Search
run_test "GET /api/companies?search=اختبار" "GET" "${BASE_URL}/api/companies?search=%D8%A7%D8%AE%D8%AA%D8%A8%D8%A7%D8%B1"

# Test 6: 404 non-existent
run_test "GET /api/companies/9999999 (expect 404)" "GET" "${BASE_URL}/api/companies/9999999"

echo "" | tee -a "$RESULTS_FILE"
echo -e "${GREEN}✅ Done. Results saved to ${RESULTS_FILE}${NC}" | tee -a "$RESULTS_FILE"


