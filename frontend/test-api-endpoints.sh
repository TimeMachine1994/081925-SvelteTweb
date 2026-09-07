#!/bin/bash

# Tributestream API Test Script
# Tests the live status polling and webhook endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:5173"
WEBHOOK_ENDPOINT="$BASE_URL/api/webhooks/stream-status"
LIVE_STATUS_ENDPOINT="$BASE_URL/api/streams/check-live-status"

echo -e "${BLUE}🧪 Tributestream API Test Suite${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local curl_command="$2"
    local expected_pattern="$3"
    
    echo -e "${YELLOW}Testing: $test_name${NC}"
    echo "Command: $curl_command"
    
    if response=$(eval "$curl_command" 2>/dev/null); then
        if [[ -n "$expected_pattern" && ! "$response" =~ $expected_pattern ]]; then
            echo -e "${RED}❌ FAILED: Response doesn't match expected pattern${NC}"
            echo "Response: $response"
            ((TESTS_FAILED++))
        else
            echo -e "${GREEN}✅ PASSED${NC}"
            echo "Response: $response" | jq . 2>/dev/null || echo "Response: $response"
            ((TESTS_PASSED++))
        fi
    else
        echo -e "${RED}❌ FAILED: Request failed${NC}"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Test 1: Webhook Health Check
run_test "Webhook Health Check (GET)" \
    "curl -s -X GET '$WEBHOOK_ENDPOINT' -H 'Content-Type: application/json'" \
    '"status":"ok"'

# Test 2: Live Status Health Check
run_test "Live Status Health Check (GET)" \
    "curl -s -X GET '$LIVE_STATUS_ENDPOINT' -H 'Content-Type: application/json'" \
    '"status":"ok"'

# Test 3: Live Status with Sample Stream IDs
run_test "Live Status with Sample Stream IDs (POST)" \
    "curl -s -X POST '$LIVE_STATUS_ENDPOINT' -H 'Content-Type: application/json' -d '{\"streamIds\": [\"sample-stream-1\", \"sample-stream-2\"]}'" \
    '"success":true'

# Test 4: Webhook with Live Input Format
run_test "Webhook with Live Input Format (POST)" \
    "curl -s -X POST '$WEBHOOK_ENDPOINT' -H 'Content-Type: application/json' -d '{\"data\": {\"input_id\": \"sample-input-123\", \"event_type\": \"live_input.connected\"}}'" \
    '"success":true'

# Test 5: Webhook with Stream Format
run_test "Webhook with Stream Format (POST)" \
    "curl -s -X POST '$WEBHOOK_ENDPOINT' -H 'Content-Type: application/json' -d '{\"uid\": \"sample-stream-456\", \"status\": {\"state\": \"ready\"}}'" \
    '"success":true'

# Test 6: Webhook Error Handling
run_test "Webhook Error Handling (Invalid Payload)" \
    "curl -s -X POST '$WEBHOOK_ENDPOINT' -H 'Content-Type: application/json' -d '{\"invalid\": \"payload\"}'" \
    '"message":"Invalid webhook payload"'

# Test 7: Live Status Error Handling
run_test "Live Status Error Handling (Invalid Data)" \
    "curl -s -X POST '$LIVE_STATUS_ENDPOINT' -H 'Content-Type: application/json' -d '{\"invalid\": \"data\"}'" \
    '"message":"streamIds array required"'

# Test 8: Webhook with Different Event Types
echo -e "${YELLOW}Testing: Webhook with Different Event Types${NC}"
echo ""

# Live Input Connected
run_test "  - Live Input Connected" \
    "curl -s -X POST '$WEBHOOK_ENDPOINT' -H 'Content-Type: application/json' -d '{\"data\": {\"input_id\": \"test-input-connected\", \"event_type\": \"live_input.connected\"}}'" \
    '"success":true'

# Live Input Disconnected
run_test "  - Live Input Disconnected" \
    "curl -s -X POST '$WEBHOOK_ENDPOINT' -H 'Content-Type: application/json' -d '{\"data\": {\"input_id\": \"test-input-disconnected\", \"event_type\": \"live_input.disconnected\"}}'" \
    '"success":true'

# Live Input Error
run_test "  - Live Input Error" \
    "curl -s -X POST '$WEBHOOK_ENDPOINT' -H 'Content-Type: application/json' -d '{\"data\": {\"input_id\": \"test-input-error\", \"event_type\": \"live_input.errored\", \"live_input_errored\": {\"error\": {\"code\": \"CONNECTION_FAILED\", \"message\": \"Failed to connect\"}}}}'" \
    '"success":true'

# Stream Ready
run_test "  - Stream Ready" \
    "curl -s -X POST '$WEBHOOK_ENDPOINT' -H 'Content-Type: application/json' -d '{\"uid\": \"test-stream-ready\", \"status\": {\"state\": \"ready\"}, \"readyToStream\": true}'" \
    '"success":true'

# Stream Error
run_test "  - Stream Error" \
    "curl -s -X POST '$WEBHOOK_ENDPOINT' -H 'Content-Type: application/json' -d '{\"uid\": \"test-stream-error\", \"status\": {\"state\": \"error\", \"errorReasonCode\": \"PROCESSING_FAILED\", \"errorReasonText\": \"Stream processing failed\"}}'" \
    '"success":true'

# Test 9: Live Status with Empty Array
run_test "Live Status with Empty Stream Array" \
    "curl -s -X POST '$LIVE_STATUS_ENDPOINT' -H 'Content-Type: application/json' -d '{\"streamIds\": []}'" \
    '"success":true'

# Test 10: Live Status with Large Array
run_test "Live Status with Large Stream Array" \
    "curl -s -X POST '$LIVE_STATUS_ENDPOINT' -H 'Content-Type: application/json' -d '{\"streamIds\": [\"stream1\", \"stream2\", \"stream3\", \"stream4\", \"stream5\"]}'" \
    '"success":true'

# Summary
echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}=================================${NC}"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! The API endpoints are working correctly.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please check the output above for details.${NC}"
    exit 1
fi
