#!/bin/bash

# 🛡️ DDoS Security Test Suite - Bash Version
# 
# Purpose: Quick security testing using curl and bash
# Usage: ./ddos-test.sh [test-type]
# 
# IMPORTANT: Only use this for testing your own systems!

set -e

# Configuration
BASE_URL="http://localhost:3000"
RESULTS_FILE="security-test-results.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_REQUESTS=0
SUCCESS_COUNT=0
RATE_LIMITED_COUNT=0
ERROR_COUNT=0

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Make HTTP request and track results
make_request() {
    local endpoint="$1"
    local method="$2"
    local data="$3"
    local description="$4"
    
    TOTAL_REQUESTS=$((TOTAL_REQUESTS + 1))
    
    local start_time=$(date +%s%3N)
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "%{http_code}|%{time_total}" \
            -X POST \
            -H "Content-Type: application/json" \
            -H "User-Agent: SecurityTester-Bash/1.0" \
            -d "$data" \
            "$BASE_URL$endpoint" 2>/dev/null || echo "000|0.000")
    else
        response=$(curl -s -w "%{http_code}|%{time_total}" \
            -X GET \
            -H "User-Agent: SecurityTester-Bash/1.0" \
            "$BASE_URL$endpoint" 2>/dev/null || echo "000|0.000")
    fi
    
    local status_code=$(echo "$response" | tail -1 | cut -d'|' -f1)
    local time_total=$(echo "$response" | tail -1 | cut -d'|' -f2)
    
    # Update counters
    case "$status_code" in
        2*)
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            ;;
        429)
            RATE_LIMITED_COUNT=$((RATE_LIMITED_COUNT + 1))
            ;;
        *)
            ERROR_COUNT=$((ERROR_COUNT + 1))
            ;;
    esac
    
    # Log result
    if [ -n "$description" ]; then
        echo "[$description] Status: $status_code, Time: ${time_total}s"
    else
        echo "Request $TOTAL_REQUESTS: Status $status_code, Time: ${time_total}s"
    fi
    
    # Log to results file
    echo "$(date '+%Y-%m-%d %H:%M:%S'),$endpoint,$method,$status_code,$time_total,$description" >> "$RESULTS_FILE"
    
    return "$status_code"
}

# Initialize results file
init_results() {
    echo "timestamp,endpoint,method,status_code,response_time,description" > "$RESULTS_FILE"
    TOTAL_REQUESTS=0
    SUCCESS_COUNT=0
    RATE_LIMITED_COUNT=0
    ERROR_COUNT=0
}

# Print test results
print_results() {
    local test_name="$1"
    
    echo ""
    echo "📊 $test_name Results:"
    echo "====================================="
    echo "Total Requests: $TOTAL_REQUESTS"
    echo "✅ Successful: $SUCCESS_COUNT ($(( SUCCESS_COUNT * 100 / TOTAL_REQUESTS ))%)"
    echo "🚫 Rate Limited: $RATE_LIMITED_COUNT ($(( RATE_LIMITED_COUNT * 100 / TOTAL_REQUESTS ))%)"
    echo "❌ Errors: $ERROR_COUNT ($(( ERROR_COUNT * 100 / TOTAL_REQUESTS ))%)"
    
    # Security assessment
    local rate_limited_percentage=$(( RATE_LIMITED_COUNT * 100 / TOTAL_REQUESTS ))
    echo ""
    echo "🛡️ Security Assessment:"
    
    if [ "$rate_limited_percentage" -gt 70 ]; then
        log_success "EXCELLENT: Strong rate limiting protection"
    elif [ "$rate_limited_percentage" -gt 50 ]; then
        log_success "GOOD: Adequate rate limiting protection"
    elif [ "$rate_limited_percentage" -gt 30 ]; then
        log_warning "MODERATE: Rate limiting could be stronger"
    else
        log_error "WEAK: Rate limiting insufficient for DDoS protection"
    fi
    
    echo "====================================="
}

# Test 1: Basic Rate Limiting
test_rate_limiting() {
    log_info "🔬 Test 1: Basic Rate Limiting"
    echo "====================================="
    
    init_results
    
    local endpoint="/auth/login"
    local data='{"email":"test@ddos.com","password":"wrongpassword"}'
    
    log_info "📡 Sending 10 requests to $endpoint"
    log_info "Expected: First 5 should succeed, rest should be rate limited (429)"
    
    for i in $(seq 1 10); do
        make_request "$endpoint" "POST" "$data" "Basic Rate Limit Test $i"
        sleep 0.1
    done
    
    print_results "Basic Rate Limiting Test"
}

# Test 2: Burst Attack
test_burst_attack() {
    log_info "🚀 Test 2: Burst Attack Simulation"
    echo "====================================="
    
    init_results
    
    local endpoint="/auth/register"
    local request_count=${1:-30}
    
    log_info "📡 Sending $request_count rapid requests"
    log_info "Expected: Most requests should be rate limited"
    
    for i in $(seq 1 "$request_count"); do
        local data="{\"name\":\"User$i\",\"email\":\"user$i@ddos.com\",\"password\":\"Test123!@#\"}"
        make_request "$endpoint" "POST" "$data" "Burst Attack $i" &
        
        # Limit concurrent requests to avoid overwhelming the system
        if [ $((i % 5)) -eq 0 ]; then
            wait
        fi
    done
    
    wait # Wait for all background jobs to complete
    
    print_results "Burst Attack Simulation"
}

# Test 3: Multi-endpoint Attack
test_multi_endpoint() {
    log_info "🎯 Test 3: Multi-endpoint Attack"
    echo "====================================="
    
    init_results
    
    log_info "📡 Testing rate limits across multiple endpoints"
    log_info "Expected: Each endpoint should have its own rate limiting"
    
    local endpoints=(
        "/auth/login|POST|{\"email\":\"test@ddos.com\",\"password\":\"wrong\"}"
        "/auth/register|POST|{\"name\":\"Test\",\"email\":\"test@ddos.com\",\"password\":\"Test123!@#\"}"
        "/auth/verify-email|POST|{\"email\":\"test@ddos.com\",\"code\":\"123456\"}"
        "/auth/forgot-password|POST|{\"email\":\"test@ddos.com\"}"
        "/auth/reset-password|POST|{\"email\":\"test@ddos.com\",\"code\":\"123456\",\"newPassword\":\"NewPass123!@#\"}"
    )
    
    for round in $(seq 1 5); do
        for endpoint_data in "${endpoints[@]}"; do
            IFS='|' read -r endpoint method data <<< "$endpoint_data"
            make_request "$endpoint" "$method" "$data" "Multi-endpoint Round $round"
            sleep 0.1
        done
    done
    
    print_results "Multi-endpoint Attack Test"
}

# Test 4: Registration Flood
test_registration_flood() {
    log_info "👥 Test 4: Registration Flood Attack"
    echo "====================================="
    
    init_results
    
    local endpoint="/auth/register"
    local flood_count=${1:-20}
    
    log_info "📡 Attempting to register $flood_count users rapidly"
    log_info "Expected: Registration rate limiting should prevent spam"
    
    for i in $(seq 1 "$flood_count"); do
        local timestamp=$(date +%s)
        local data="{\"name\":\"FloodUser$i\",\"email\":\"flood$i-$timestamp@ddos.com\",\"password\":\"Test123!@#\"}"
        make_request "$endpoint" "POST" "$data" "Registration Flood $i"
        sleep 0.2
    done
    
    print_results "Registration Flood Test"
}

# Test 5: Password Reset Flood
test_password_reset_flood() {
    log_info "🔑 Test 5: Password Reset Flood"
    echo "====================================="
    
    init_results
    
    local endpoint="/auth/forgot-password"
    local flood_count=${1:-15}
    
    log_info "📡 Attempting $flood_count password reset requests"
    log_info "Expected: Password reset rate limiting should prevent abuse"
    
    for i in $(seq 1 "$flood_count"); do
        local data="{\"email\":\"victim$i@ddos.com\"}"
        make_request "$endpoint" "POST" "$data" "Password Reset Flood $i"
        sleep 0.3
    done
    
    print_results "Password Reset Flood Test"
}

# Check server availability
check_server() {
    log_info "🔍 Checking server availability..."
    
    if make_request "/" "GET" "" "Health Check" >/dev/null 2>&1; then
        log_success "Server is running at $BASE_URL"
        return 0
    else
        log_error "Server is not running! Start your NestJS server first."
        return 1
    fi
}

# Generate test report
generate_report() {
    local report_file="security-test-report-$(date +%Y%m%d-%H%M%S).html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Security Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .test-section { margin: 20px 0; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ DDoS Security Test Report</h1>
        <p>Generated: $(date)</p>
        <p>Target: $BASE_URL</p>
    </div>
    
    <div class="test-section">
        <h2>Test Results Summary</h2>
        <p>Detailed results have been saved to: $RESULTS_FILE</p>
        <p>Run the tests to see comprehensive security assessment.</p>
    </div>
    
    <div class="test-section">
        <h2>Available Tests</h2>
        <ul>
            <li><strong>rate-limit</strong> - Basic rate limiting test</li>
            <li><strong>burst</strong> - Burst attack simulation</li>
            <li><strong>multi-endpoint</strong> - Multi-endpoint attack test</li>
            <li><strong>registration-flood</strong> - Registration flood test</li>
            <li><strong>password-flood</strong> - Password reset flood test</li>
            <li><strong>all</strong> - Run all tests</li>
        </ul>
    </div>
    
    <div class="test-section">
        <h2>Security Recommendations</h2>
        <ul>
            <li>Ensure rate limiting returns 429 status for blocked requests</li>
            <li>Monitor for sustained high error rates</li>
            <li>Implement progressive delays for repeated violations</li>
            <li>Consider implementing CAPTCHA for suspicious activity</li>
            <li>Set up monitoring and alerting for DDoS attempts</li>
        </ul>
    </div>
</body>
</html>
EOF
    
    log_success "Test report generated: $report_file"
}

# Main function
main() {
    local command=${1:-help}
    
    echo "🛡️ DDoS Security Test Suite (Bash)"
    echo "=================================="
    echo "⚠️  DISCLAIMER: This is for testing YOUR OWN system only!"
    echo "⚠️  DO NOT use against systems you don't own!"
    echo "=="
    
    case "$command" in
        "rate-limit")
            check_server && test_rate_limiting
            ;;
        "burst")
            local count=${2:-30}
            check_server && test_burst_attack "$count"
            ;;
        "multi-endpoint")
            check_server && test_multi_endpoint
            ;;
        "registration-flood")
            local count=${2:-20}
            check_server && test_registration_flood "$count"
            ;;
        "password-flood")
            local count=${2:-15}
            check_server && test_password_reset_flood "$count"
            ;;
        "all")
            if check_server; then
                test_rate_limiting
                echo ""
                sleep 2
                test_burst_attack 20
                echo ""
                sleep 2
                test_multi_endpoint
                echo ""
                sleep 2
                test_registration_flood 15
                echo ""
                sleep 2
                test_password_reset_flood 10
                echo ""
                log_success "🎉 All security tests completed!"
                generate_report
            fi
            ;;
        "report")
            generate_report
            ;;
        "help"|*)
            echo ""
            echo "Usage: $0 [command] [options]"
            echo ""
            echo "Commands:"
            echo "  rate-limit           - Test basic rate limiting"
            echo "  burst [count]        - Test burst attacks (default: 30)"
            echo "  multi-endpoint       - Test multiple endpoints"
            echo "  registration-flood [count] - Test registration flood (default: 20)"
            echo "  password-flood [count]     - Test password reset flood (default: 15)"
            echo "  all                  - Run all tests"
            echo "  report               - Generate HTML report"
            echo "  help                 - Show this help"
            echo ""
            echo "Examples:"
            echo "  $0 all"
            echo "  $0 burst 50"
            echo "  $0 rate-limit"
            echo ""
            echo "Make sure your NestJS server is running on localhost:3000"
            echo ""
            ;;
    esac
}

# Run main function with all arguments
main "$@"
