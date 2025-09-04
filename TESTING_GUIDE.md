# 🚀 NestJS Authentication API - Quick Test Guide

## Prerequisites
```bash
npm run start:dev  # Server should be running on http://localhost:3000
```

## 🧪 **Test Security Features**

### 1. **Test Registration with Strong Password**
```bash
# ✅ Valid strong password
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

```bash
# ❌ Weak password (should fail)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "123456",
    "name": "Test User 2"
  }'
```

### 2. **Test Rate Limiting (Registration)**
```bash
# Test registration rate limit (max 3 per hour)
for i in {1..4}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:3000/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test'$i'@example.com",
      "password": "SecurePass123!",
      "name": "Test User '$i'"
    }'
  echo -e "\n"
done
# 4th attempt should return 429 Too Many Requests
```

### 3. **Test Account Lockout**
```bash
# Register a user first
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "locktest@example.com",
    "password": "SecurePass123!",
    "name": "Lock Test"
  }'

# Try wrong password 6 times (account locks after 5 attempts)
for i in {1..6}; do
  echo "Failed login attempt $i:"
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "locktest@example.com",
      "password": "WrongPassword123!"
    }'
  echo -e "\n"
done
# Account should be locked after 5 attempts
```

### 4. **Test Login Rate Limiting**
```bash
# Test login rate limit (max 5 attempts per 15 minutes)
for i in {1..6}; do
  echo "Login attempt $i:"
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "WrongPassword"
    }'
  echo -e "\n"
done
# 6th attempt should return 429 Too Many Requests
```

### 5. **Test JWT Refresh Token**
```bash
# 1. Login successfully
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }')

echo "Login Response: $LOGIN_RESPONSE"

# Extract tokens (you'll need to parse JSON manually or use jq)
# ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# REFRESH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Use refresh token to get new access token
# curl -X POST http://localhost:3000/auth/refresh \
#   -H "Content-Type: application/json" \
#   -d '{"refresh_token":"'$REFRESH_TOKEN'"}'
```

### 6. **Test Code Expiry (Manual Test)**
```bash
# 1. Register user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "expiry@example.com",
    "password": "SecurePass123!",
    "name": "Expiry Test"
  }'

# 2. Wait 16 minutes, then try to verify (should fail)
# curl -X POST http://localhost:3000/auth/verify-email \
#   -H "Content-Type: application/json" \
#   -d '{
#     "email": "expiry@example.com",
#     "code": "123456"
#   }'
```

## 📊 **Expected Results**

### ✅ **Successful Tests**
- Strong password registration: `201 Created`
- Valid login: `200 OK` with tokens
- Refresh token: `200 OK` with new access token
- Password reset request: `200 OK`

### ❌ **Security Blocks (Expected)**
- Weak password: `400 Bad Request` with validation errors
- Rate limit exceeded: `429 Too Many Requests`
- Account locked: `401 Unauthorized` with lockout message
- Expired code: `400 Bad Request` with expiry message
- Invalid refresh token: `401 Unauthorized`

## 🔍 **Monitor Audit Logs**

Check database for audit logs:
```sql
-- View recent security events
SELECT * FROM audit_logs 
ORDER BY createdAt DESC 
LIMIT 10;

-- View failed login attempts
SELECT * FROM audit_logs 
WHERE action = 'LOGIN' AND status = 'FAILURE'
ORDER BY createdAt DESC;

-- View account lockouts
SELECT * FROM audit_logs 
WHERE action = 'ACCOUNT_LOCKED'
ORDER BY createdAt DESC;
```

## 🛡️ **Security Features Status**

| Feature | Status | Test Command |
|---------|--------|--------------|
| Strong Passwords | ✅ | Weak password registration |
| Rate Limiting | ✅ | Multiple rapid requests |
| Account Lockout | ✅ | 6 failed login attempts |
| Code Expiry | ✅ | Wait 16 minutes |
| Crypto-secure Codes | ✅ | Check generated codes |
| JWT Refresh | ✅ | Use refresh token |
| Audit Logging | ✅ | Check database logs |

## 🔧 **Database Schema Check**

Verify new security fields exist:
```sql
-- Check users table for new security fields
DESCRIBE users;

-- Check audit_logs table exists
DESCRIBE audit_logs;

-- View user with security fields
SELECT id, email, failedLoginAttempts, lockedUntil, 
       refreshTokenExpires, emailVerificationCodeExpires 
FROM users 
LIMIT 5;
```

## 🎯 **Production Testing Checklist**

- [ ] ✅ Strong password validation working
- [ ] ✅ Rate limiting blocking excessive requests  
- [ ] ✅ Account lockout after 5 failed attempts
- [ ] ✅ JWT tokens expire in 15 minutes
- [ ] ✅ Refresh tokens working properly
- [ ] ✅ Verification codes expire in 15 minutes
- [ ] ✅ Audit logs recording all activities
- [ ] ✅ Crypto-secure code generation
- [ ] ✅ All endpoints protected with rate limiting

**🎉 Result: All security features implemented and testable!**
