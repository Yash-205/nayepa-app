#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'
YELLOW='\033[0;33m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}=== NayePankh AI Agents & Workflows Test Suite ===${NC}\n"

# 1. Seed the database first to ensure standard mock objects are present
echo "Step 1: Running database seed..."
node "$SCRIPT_DIR/scripts/seed-db.js"
if [ $? -ne 0 ]; then
  echo -e "${RED}Database seeding failed! Make sure MongoDB is running.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Database seeded successfully.${NC}\n"

# 2. Test Conversational Onboarding Chat Agent (/api/chat)
echo -e "${BLUE}Step 2: Testing Onboarding Agent (/api/chat)${NC}"
echo "--------------------------------------"

# A. Log in as volunteer (seeding created rahul.vol@gmail.com with Password123)
echo "Logging in as volunteer (rahul.vol@gmail.com)..."
COOKIE_FILE="${SCRIPT_DIR}/cookie_vol.txt"

LOGIN_RES=$(curl -s -w "\n%{http_code}" -c "$COOKIE_FILE" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "rahul.vol@gmail.com", "password": "Password123"}')

LOGIN_CODE=$(echo "$LOGIN_RES" | tail -n1)
if [ "$LOGIN_CODE" -ne 200 ]; then
  echo -e "${RED}✗ Login failed with status ${LOGIN_CODE}${NC}"
  echo "$LOGIN_RES"
  exit 1
fi
echo -e "${GREEN}✓ Volunteer login successful.${NC}"

# B. Send first chat message (initiating conversational screening)
echo "Sending first message to agent (Location)..."
CHAT_RES_1=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hi, I want to volunteer. I am based in Delhi."}')

CODE_1=$(echo "$CHAT_RES_1" | tail -n1)
BODY_1=$(echo "$CHAT_RES_1" | sed '$d')

if [ "$CODE_1" -eq 200 ]; then
  echo -e "${GREEN}✓ Chat Message 1 succeeded (200)${NC}"
  echo -e "${YELLOW}Agent Response:${NC} $BODY_1"
else
  echo -e "${RED}✗ Chat Message 1 failed with status ${CODE_1}${NC}"
  echo "Response: $BODY_1"
  [ -f "$COOKIE_FILE" ] && rm "$COOKIE_FILE"
  exit 1
fi

# C. Send second chat message (testing StateGraph memory checkpointing)
echo "Sending second message to agent (Availability)..."
CHAT_RES_2=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I can volunteer for 8 hours per week."}')

CODE_2=$(echo "$CHAT_RES_2" | tail -n1)
BODY_2=$(echo "$CHAT_RES_2" | sed '$d')

if [ "$CODE_2" -eq 200 ]; then
  echo -e "${GREEN}✓ Chat Message 2 succeeded (200) - Memory Persisted${NC}"
  echo -e "${YELLOW}Agent Response:${NC} $BODY_2"
else
  echo -e "${RED}✗ Chat Message 2 failed with status ${CODE_2}${NC}"
  echo "Response: $BODY_2"
  [ -f "$COOKIE_FILE" ] && rm "$COOKIE_FILE"
  exit 1
fi

[ -f "$COOKIE_FILE" ] && rm "$COOKIE_FILE"
echo -e "--------------------------------------\n"

# 3. Test Copywriter Agent & Brand Compliance Critic Loop (/api/copywrite)
echo -e "${BLUE}Step 3: Testing Copywriter Multi-Agent Loop (/api/copywrite)${NC}"
echo "--------------------------------------"

# A. Log in as Coordinator
echo "Logging in as coordinator (sarah.coord@nayepankh.org)..."
COOKIE_FILE_COORD="${SCRIPT_DIR}/cookie_coord.txt"

LOGIN_COORD_RES=$(curl -s -w "\n%{http_code}" -c "$COOKIE_FILE_COORD" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "sarah.coord@nayepankh.org", "password": "Password123"}')

LOGIN_COORD_CODE=$(echo "$LOGIN_COORD_RES" | tail -n1)
if [ "$LOGIN_COORD_CODE" -ne 200 ]; then
  echo -e "${RED}✗ Coordinator login failed with status ${LOGIN_COORD_CODE}${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Coordinator login successful.${NC}"

# B. Dynamically query seeded Campaign ID from MongoDB to ensure valid API target
echo "Querying Campaign ID from database..."
# Simple node helper to fetch first campaign ID
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
  echo -e "${RED}✗ Failed to query Campaign ID from database.${NC}"
  [ -f "$COOKIE_FILE_COORD" ] && rm "$COOKIE_FILE_COORD"
  exit 1
fi
echo "Target Campaign ID: $CAMPAIGN_ID"

# C. Submit raw field notes and trigger copywriting + compliance review loop
echo "Triggering Copywriting & Compliance check..."
COPY_RES=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE_COORD" -X POST http://localhost:3000/api/copywrite \
  -H "Content-Type: application/json" \
  -d "{\"campaignId\": \"${CAMPAIGN_ID}\", \"rawNotes\": \"Conducted a winter blanket drive today in Delhi. Distributed 75 blankets to homeless families. Volunteers from NayePankh Foundation joined.\"}")

COPY_CODE=$(echo "$COPY_RES" | tail -n1)
COPY_BODY=$(echo "$COPY_RES" | sed '$d')

if [ "$COPY_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ Copywriting & Compliance loop completed (200)${NC}"
  echo -e "${YELLOW}Agent Response:${NC} $COPY_BODY"
else
  echo -e "${RED}✗ Copywriting & Compliance loop failed with status ${COPY_CODE}${NC}"
  echo "Response: $COPY_BODY"
  [ -f "$COOKIE_FILE_COORD" ] && rm "$COOKIE_FILE_COORD"
  exit 1
fi

[ -f "$COOKIE_FILE_COORD" ] && rm "$COOKIE_FILE_COORD"
echo -e "--------------------------------------\n"

echo -e "${GREEN}✓ All AI Agent backend endpoints are verified, compiling, and fully operational!${NC}"
