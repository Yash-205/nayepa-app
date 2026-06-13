#!/bin/bash
set -e

BASE="http://localhost:3000"
COOKIE_FILE="/tmp/nayepa_test_cookies_4.txt"

echo "=== 1. Register test user ==="
REG=$(curl -s -c $COOKIE_FILE -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Mock Test\",\"email\":\"mocktest_$(date +%s)@test.com\",\"password\":\"TestPass123\",\"role\":\"Volunteer\"}")

EMAIL=$(echo "$REG" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('user', {}).get('email', ''))" 2>/dev/null || echo "")

if [ -z "$EMAIL" ]; then
  echo "Registration failed. Output: $REG"
  exit 1
fi

echo "Registered: $EMAIL"

echo "=== 2. Login test user ==="
curl -s -c $COOKIE_FILE -b $COOKIE_FILE -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"TestPass123\"}" > /dev/null

echo "=== 3. Chat Session 1 (First Message) ==="
MSG1=$(curl -s -b $COOKIE_FILE -X POST "$BASE/api/chat" -H "Content-Type: application/json" -d "{\"message\":\"Hello Session 1\"}")
SESSION1=$(echo "$MSG1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('sessionId', ''))" 2>/dev/null)
echo "Session 1 ID: $SESSION1"

echo "=== 4. Chat Session 2 (New Chat) ==="
# No sessionId passed -> should create a new session
MSG2=$(curl -s -b $COOKIE_FILE -X POST "$BASE/api/chat" -H "Content-Type: application/json" -d "{\"message\":\"Hello Session 2\"}")
SESSION2=$(echo "$MSG2" | python3 -c "import sys,json; print(json.load(sys.stdin).get('sessionId', ''))" 2>/dev/null)
echo "Session 2 ID: $SESSION2"

echo "=== 5. Fetch Session 1 History ==="
HISTORY1=$(curl -s -b $COOKIE_FILE "$BASE/api/chat?sessionId=$SESSION1")
echo "Session 1 History contains:"
echo "$HISTORY1" | python3 -c "import sys,json; [print(f\"[{m['role']}] {m['text']}\") for m in json.load(sys.stdin).get('messages', [])]"

echo "=== 6. Fetch Session 2 History ==="
HISTORY2=$(curl -s -b $COOKIE_FILE "$BASE/api/chat?sessionId=$SESSION2")
echo "Session 2 History contains:"
echo "$HISTORY2" | python3 -c "import sys,json; [print(f\"[{m['role']}] {m['text']}\") for m in json.load(sys.stdin).get('messages', [])]"
