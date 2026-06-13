#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# Resolve absolute directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}=== NayePankh Auth API Test Suite ===${NC}\n"

# 1. Clean up database first
echo "Step 1: Running pre-test database cleanup..."
node "$SCRIPT_DIR/scripts/test-cleanup.js"
if [ $? -ne 0 ]; then
  echo -e "${RED}Pre-test cleanup failed! Make sure MongoDB is running.${NC}"
  exit 1
fi
echo -e "${GREEN}Database is clean.${NC}\n"

# Helper function to run full registration, login, profile check, and logout sequence
run_test_flow() {
  local role=$1
  local name=$2
  local email=$3
  local password="testpassword123"
  local cookie_file="${SCRIPT_DIR}/cookie_${role}.txt"

  echo -e "${BLUE}Testing Role: ${role}${NC}"
  echo "--------------------------------------"

  # A. Registration
  echo "Registering user..."
  REG_RES=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"${name}\", \"email\": \"${email}\", \"password\": \"${password}\", \"role\": \"${role}\"}")
  
  REG_CODE=$(echo "$REG_RES" | tail -n1)
  REG_BODY=$(echo "$REG_RES" | sed '$d')

  if [ "$REG_CODE" -eq 201 ]; then
    echo -e "${GREEN}✓ Registration succeeded (201)${NC}"
    echo "Response: $REG_BODY"
  else
    echo -e "${RED}✗ Registration failed with status ${REG_CODE}${NC}"
    echo "Response: $REG_BODY"
    exit 1
  fi

  # B. Login
  echo "Logging in..."
  LOGIN_RES=$(curl -s -w "\n%{http_code}" -c "$cookie_file" -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"${email}\", \"password\": \"${password}\"}")
  
  LOGIN_CODE=$(echo "$LOGIN_RES" | tail -n1)
  LOGIN_BODY=$(echo "$LOGIN_RES" | sed '$d')

  if [ "$LOGIN_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Login succeeded (200) - Session Cookie Set${NC}"
  else
    echo -e "${RED}✗ Login failed with status ${LOGIN_CODE}${NC}"
    echo "Response: $LOGIN_BODY"
    [ -f "$cookie_file" ] && rm "$cookie_file"
    exit 1
  fi

  # C. Get Profile info
  echo "Fetching session profile (/api/auth/me)..."
  ME_RES=$(curl -s -w "\n%{http_code}" -b "$cookie_file" http://localhost:3000/api/auth/me)
  
  ME_CODE=$(echo "$ME_RES" | tail -n1)
  ME_BODY=$(echo "$ME_RES" | sed '$d')

  if [ "$ME_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Session verification succeeded (200)${NC}"
    echo "Session User: $ME_BODY"
  else
    echo -e "${RED}✗ Session verification failed with status ${ME_CODE}${NC}"
    echo "Response: $ME_BODY"
    [ -f "$cookie_file" ] && rm "$cookie_file"
    exit 1
  fi

  # D. Logout
  echo "Logging out..."
  LOGOUT_RES=$(curl -s -w "\n%{http_code}" -b "$cookie_file" -X POST http://localhost:3000/api/auth/logout)
  
  LOGOUT_CODE=$(echo "$LOGOUT_RES" | tail -n1)
  LOGOUT_BODY=$(echo "$LOGOUT_RES" | sed '$d')

  if [ "$LOGOUT_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Logout succeeded (200)${NC}"
  else
    echo -e "${RED}✗ Logout failed with status ${LOGOUT_CODE}${NC}"
    echo "Response: $LOGOUT_BODY"
  fi

  # Clean up temp cookie file
  [ -f "$cookie_file" ] && rm "$cookie_file"
  echo -e "--------------------------------------\n"
}

# 2. Run flows for each role
run_test_flow "Volunteer" "Aarav Volunteer" "test-volunteer@nayepankh.org"
run_test_flow "Coordinator" "Neha Coordinator" "test-coordinator@nayepankh.org"
run_test_flow "Admin" "Yash Admin" "test-admin@nayepankh.org"

# 3. Clean up database after tests
echo "Step 3: Running post-test database cleanup..."
node "$SCRIPT_DIR/scripts/test-cleanup.js"
echo -e "${GREEN}✓ All tests completed. Test database accounts purged successfully.${NC}"
