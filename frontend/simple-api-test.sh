#!/bin/bash

# Simple Tributestream API Test Script
echo "🧪 Tributestream API Test Suite"
echo "================================="
echo ""

BASE_URL="http://localhost:5173"
TESTS_PASSED=0
TESTS_FAILED=0

test_endpoint() {
    local name="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    
    echo "Testing: $name"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -X GET "$url" -H "Content-Type: application/json")
    else
        response=$(curl -s -X POST "$url" -H "Content-Type: application/json" -d "$data")
    fi
    
    if [ $? -eq 0 ] && [ -n "$response" ]; then
        echo "✅ PASSED"
        echo "Response: $response" | jq . 2>/dev/null || echo "Response: $response"
        ((TESTS_PASSED++))
    else
        echo "❌ FAILED"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Run tests
test_endpoint "Webhook Health Check" "$BASE_URL/api/webhooks/stream-status" "GET"

test_endpoint "Live Status Health Check" "$BASE_URL/api/streams/check-live-status" "GET"

test_endpoint "Live Status with Sample Data" "$BASE_URL/api/streams/check-live-status" "POST" '{"streamIds": ["sample-1", "sample-2"]}'

test_endpoint "Webhook Live Input Format" "$BASE_URL/api/webhooks/stream-status" "POST" '{"data": {"input_id": "test-123", "event_type": "live_input.connected"}}'

test_endpoint "Webhook Stream Format" "$BASE_URL/api/webhooks/stream-status" "POST" '{"uid": "test-456", "status": {"state": "ready"}}'

test_endpoint "Webhook Invalid Payload" "$BASE_URL/api/webhooks/stream-status" "POST" '{"invalid": "payload"}'

test_endpoint "Live Status Invalid Data" "$BASE_URL/api/streams/check-live-status" "POST" '{"invalid": "data"}'

# Summary
echo "================================="
echo "Test Summary"
echo "================================="
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "🎉 All tests passed!"
else
    echo "⚠️ Some tests failed."
fi
