#!/bin/bash

# Color codes (Emoji-free)
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'
YELLOW='\033[0;33m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="http://localhost:3000"

echo -e "${BLUE}=== NayePankh Backend API Unified Test Suite ===${NC}\n"

# 1. Database Seed
echo "Step 1: Seeding database..."
node "$SCRIPT_DIR/scripts/seed-db.js"
if [ $? -ne 0 ]; then
  echo -e "${RED}[ERROR] Database seeding failed. Make sure MongoDB is running.${NC}" >&2
  exit 1
fi
echo -e "${GREEN}[OK] Database seeded successfully.${NC}\n"

COOKIE_FILE="${SCRIPT_DIR}/cookie_temp.txt"
[ -f "$COOKIE_FILE" ] && rm "$COOKIE_FILE"

# Helper for verifying API responses
verify_response() {
  local response="$1"
  local expected_status="$2"
  local action_name="$3"
  local status_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')

  if [ "$status_code" -ne "$expected_status" ]; then
    echo -e "${RED}[FAIL] $action_name failed with status $status_code (expected $expected_status)${NC}" >&2
    echo -e "${RED}Response: $body${NC}" >&2
    [ -f "$COOKIE_FILE" ] && rm "$COOKIE_FILE"
    exit 1
  else
    echo -e "${GREEN}[SUCCESS] $action_name passed with status $status_code${NC}" >&2
    echo "$body"
  fi
}

# 2. Test Volunteer Auth & Chat Loop
echo -e "${BLUE}Step 2: Testing Volunteer Auth and conversational Chat (/api/chat)${NC}"
echo "--------------------------------------"

VOL_EMAIL="test-volunteer@nayepankh.org"
VOL_PASS="testpassword123"

# A. Register
echo "Registering new volunteer..."
REG_RES=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Test Volunteer\", \"email\": \"${VOL_EMAIL}\", \"password\": \"${VOL_PASS}\", \"role\": \"Volunteer\"}")
verify_response "$REG_RES" 201 "Volunteer Registration" > /dev/null

# B. Login
echo "Logging in..."
LOGIN_RES=$(curl -s -w "\n%{http_code}" -c "$COOKIE_FILE" -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${VOL_EMAIL}\", \"password\": \"${VOL_PASS}\"}")
verify_response "$LOGIN_RES" 200 "Volunteer Login" > /dev/null

# C. Verify profile session
echo "Checking profile session (/api/auth/me)..."
ME_RES=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" "${BASE_URL}/api/auth/me")
verify_response "$ME_RES" 200 "Profile Session Check" > /dev/null

# D. Chat screening message 1 (Starts Session 1)
echo "Sending onboarding message 1..."
CHAT_RES_1=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" -X POST "${BASE_URL}/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, I want to volunteer. I am based in Bangalore."}')
BODY_1=$(verify_response "$CHAT_RES_1" 200 "Chat Message 1")
SESS_ID_1=$(echo "$BODY_1" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).sessionId || ''); } catch (e) {}")
EXTRACTED_1=$(echo "$BODY_1" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).response || ''); } catch (e) {}")
echo -e "${YELLOW}Agent Response 1 (Session $SESS_ID_1):${NC} $EXTRACTED_1"

# E. Chat screening message 2
echo "Sending onboarding message 2..."
CHAT_RES_2=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" -X POST "${BASE_URL}/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"I can commit 6 hours per week.\", \"sessionId\": \"$SESS_ID_1\"}")
BODY_2=$(verify_response "$CHAT_RES_2" 200 "Chat Message 2")
EXTRACTED_2=$(echo "$BODY_2" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).response || ''); } catch (e) {}")
echo -e "${YELLOW}Agent Response 2:${NC} $EXTRACTED_2"

# F. Chat screening message 3 (Completing onboarding)
echo "Sending onboarding message 3 (skills)..."
CHAT_RES_3=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" -X POST "${BASE_URL}/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"I have teaching and public speaking skills.\", \"sessionId\": \"$SESS_ID_1\"}")
BODY_3=$(verify_response "$CHAT_RES_3" 200 "Chat Message 3")
EXTRACTED_3=$(echo "$BODY_3" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).response || ''); } catch (e) {}")
IS_COMPLETE=$(echo "$BODY_3" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).onboardingComplete || false); } catch (e) {}")
echo -e "${YELLOW}Agent Response 3:${NC} $EXTRACTED_3"
echo -e "${YELLOW}Onboarding Completed Flag:${NC} $IS_COMPLETE"

# G. Chat post-onboarding message 4 (Verify General AI Chatbot transition)
echo "Sending post-onboarding general chat query..."
CHAT_RES_4=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" -X POST "${BASE_URL}/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Can you give me information about active campaigns?\", \"sessionId\": \"$SESS_ID_1\"}")
BODY_4=$(verify_response "$CHAT_RES_4" 200 "General AI Chat Query 1")
EXTRACTED_4=$(echo "$BODY_4" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).response || ''); } catch (e) {}")
echo -e "${YELLOW}Agent Response 4 (General AI):${NC} $EXTRACTED_4"

# H. Send message 5, 6, and 7 to exceed history size of 6 and trigger summarization memory
echo "Sending message 5 to build up history..."
CHAT_RES_5=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" -X POST "${BASE_URL}/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"How do I get my volunteering certificate?\", \"sessionId\": \"$SESS_ID_1\"}")
verify_response "$CHAT_RES_5" 200 "General AI Chat Query 2" > /dev/null

echo "Sending message 6 to build up history..."
CHAT_RES_6=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" -X POST "${BASE_URL}/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Tell me about animal welfare drives.\", \"sessionId\": \"$SESS_ID_1\"}")
verify_response "$CHAT_RES_6" 200 "General AI Chat Query 3" > /dev/null

echo "Sending message 7 (This should trigger summarization as history exceeds 6)..."
CHAT_RES_7=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" -X POST "${BASE_URL}/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What are the hygiene camp details?\", \"sessionId\": \"$SESS_ID_1\"}")
BODY_7=$(verify_response "$CHAT_RES_7" 200 "Summarized History Chat Query")
EXTRACTED_7=$(echo "$BODY_7" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).response || ''); } catch (e) {}")
echo -e "${YELLOW}Agent Response 7 (After Summarization):${NC} $EXTRACTED_7"

# I. Test Session Switching: Start a brand new Session 2 without sessionId
echo "Starting Session 2 to verify session switching and thread isolation..."
CHAT_RES_SESS2=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" -X POST "${BASE_URL}/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, I am a new applicant."}')
BODY_SESS2=$(verify_response "$CHAT_RES_SESS2" 200 "New Chat Session")
SESS_ID_2=$(echo "$BODY_SESS2" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).sessionId || ''); } catch (e) {}")
EXTRACTED_SESS2=$(echo "$BODY_SESS2" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).response || ''); } catch (e) {}")
echo -e "${YELLOW}Agent Response (Session $SESS_ID_2):${NC} $EXTRACTED_SESS2"

# J. Logout
echo "Logging out..."
LOGOUT_RES=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" -X POST "${BASE_URL}/api/auth/logout")
verify_response "$LOGOUT_RES" 200 "Volunteer Logout" > /dev/null
[ -f "$COOKIE_FILE" ] && rm "$COOKIE_FILE"
echo -e "--------------------------------------\n"

# 3. Test Coordinator Auth & Copywriting Loop
echo -e "${BLUE}Step 3: Testing Coordinator Auth and Multi-Agent Copywriting (/api/copywrite)${NC}"
echo "--------------------------------------"

COORD_EMAIL="test-coordinator@nayepankh.org"
COORD_PASS="testpassword123"

# A. Register Coordinator
echo "Registering new coordinator..."
REG_COORD_RES=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Test Coordinator\", \"email\": \"${COORD_EMAIL}\", \"password\": \"${VOL_PASS}\", \"role\": \"Coordinator\"}")
verify_response "$REG_COORD_RES" 201 "Coordinator Registration" > /dev/null

# B. Login
echo "Logging in..."
LOGIN_COORD_RES=$(curl -s -w "\n%{http_code}" -c "$COOKIE_FILE" -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${COORD_EMAIL}\", \"password\": \"${COORD_PASS}\"}")
verify_response "$LOGIN_COORD_RES" 200 "Coordinator Login" > /dev/null

# C. Fetch Campaign ID from MongoDB
echo "Querying Campaign ID from database..."
CAMPAIGN_ID=$(node -e "
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
try {
  const envPath = path.resolve('$SCRIPT_DIR', '.env.local');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) { process.env[match[1]] = (match[2] || '').replace(/['\"']/g, '').trim(); }
    });
  }
} catch (e) {}
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nayepa';
mongoose.connect(MONGODB_URI).then(async () => {
  const c = await mongoose.connection.db.collection('campaigns').findOne({});
  console.log(c._id.toString());
  mongoose.disconnect();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
")

if [ -z "$CAMPAIGN_ID" ]; then
  echo -e "${RED}[ERROR] Failed to query Campaign ID from database.${NC}" >&2
  [ -f "$COOKIE_FILE" ] && rm "$COOKIE_FILE"
  exit 1
fi
echo "Target Campaign ID: $CAMPAIGN_ID"

# D. Submit Campaign log for Copywriting Agent
echo "Triggering copywriting and brand critic review loop..."
COPY_RES=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" -X POST "${BASE_URL}/api/copywrite" \
  -H "Content-Type: application/json" \
  -d "{\"campaignId\": \"${CAMPAIGN_ID}\", \"rawNotes\": \"Conducted a winter blanket drive today in Delhi. Distributed 75 blankets to homeless families. Volunteers from NayePankh Foundation joined.\"}")
BODY_COPY=$(verify_response "$COPY_RES" 200 "Copywriter Multi-Agent Loop")
APPROVED=$(echo "$BODY_COPY" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).approved ?? ''); } catch (e) {}")
FEEDBACK=$(echo "$BODY_COPY" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).criticFeedback || ''); } catch (e) {}")
echo -e "${YELLOW}Approved:${NC} $APPROVED"
echo -e "${YELLOW}Critic Feedback:${NC} $FEEDBACK"

# E. Logout
echo "Logging out..."
LOGOUT_COORD_RES=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" -X POST "${BASE_URL}/api/auth/logout")
verify_response "$LOGOUT_COORD_RES" 200 "Coordinator Logout" > /dev/null
[ -f "$COOKIE_FILE" ] && rm "$COOKIE_FILE"
echo -e "--------------------------------------\n"

# 4. Cleanup Test Database Entries
echo "Step 4: Cleaning up test accounts from database..."
node "$SCRIPT_DIR/scripts/test-cleanup.js"
if [ $? -ne 0 ]; then
  echo -e "${RED}[ERROR] Database cleanup script failed.${NC}" >&2
  exit 1
fi

echo -e "${GREEN}[SUCCESS] All backend API routes verified and fully operational!${NC}"
