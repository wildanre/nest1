# 🧪 Security Testing Guide - DDoS & Rate Limiting Tests

## 📋 **Daftar Test Scripts**

### **📁 File yang Tersedia:**
- `security-tests/ddos-test.js` - Node.js comprehensive security test  
- `security-tests/ddos-test.sh` - Bash script untuk quick testing
- `SECURITY_ENHANCEMENTS.md` - Dokumentasi lengkap fitur security
- `TESTING_GUIDE.md` - Panduan testing ini

---

## 🚀 **Quick Start - Menjalankan DDoS Tests**

### **Langkah 1: Pastikan Server Berjalan**
```bash
# Terminal 1: Start NestJS server
cd /Users/danuste/Desktop/kuliah/nest-js/nest1
npm run start:dev

# Wait for: "Nest application successfully started"
```

### **Langkah 2: Jalankan Security Tests**

#### **🎯 Node.js Script (Recommended)**
```bash
# Terminal 2: Run comprehensive tests
cd /Users/danuste/Desktop/kuliah/nest-js/nest1
node security-tests/ddos-test.js all

# Atau test individual:
node security-tests/ddos-test.js rate-limit     # Test rate limiting
node security-tests/ddos-test.js burst 50 10   # Test burst attack  
node security-tests/ddos-test.js sustained     # Test sustained attack
node security-tests/ddos-test.js lockout       # Test account lockout
```

#### **⚡ Bash Script (Quick Tests)**
```bash
# Terminal 2: Run bash tests
cd /Users/danuste/Desktop/kuliah/nest-js/nest1
./security-tests/ddos-test.sh all

# Atau test individual:
./security-tests/ddos-test.sh rate-limit
./security-tests/ddos-test.sh burst 30
./security-tests/ddos-test.sh multi-endpoint
```

## 📊 **Expected Security Results**

Sistem yang baik akan menunjukkan:

### **✅ Strong Security (Rate Limited 70%+)**
```
📊 Test Results:
Total Requests: 50
✅ Successful: 5 (10.0%)
🚫 Rate Limited: 40 (80.0%)  ← This is good!
❌ Errors: 5 (10.0%)

🛡️ Security Assessment:
✅ EXCELLENT: Strong rate limiting protection
```

### **⚠️ Moderate Security (Rate Limited 30-70%)**
```
📊 Test Results:  
Total Requests: 50
✅ Successful: 25 (50.0%)
🚫 Rate Limited: 20 (40.0%)
❌ Errors: 5 (10.0%)

🛡️ Security Assessment:
⚠️ MODERATE: Rate limiting could be stronger
```

### **❌ Weak Security (Rate Limited <30%)**
```
📊 Test Results:
Total Requests: 50
✅ Successful: 40 (80.0%)
🚫 Rate Limited: 5 (10.0%)  ← This is bad!
❌ Errors: 5 (10.0%)

🛡️ Security Assessment:
❌ WEAK: Rate limiting insufficient for DDoS protection
```

## 🔬 **Available Test Cases**

### **Test 1: Basic Rate Limiting**
```bash
node security-tests/ddos-test.js rate-limit
```
- **Purpose:** Test basic rate limiting functionality
- **Expected:** First 5 login attempts succeed, rest get 429 (rate limited)  
- **Endpoint:** `/auth/login`
- **Rate Limit:** 5 attempts per 15 minutes

### **Test 2: Burst Attack Simulation**  
```bash
node security-tests/ddos-test.js burst [count] [concurrency]
# Default: 50 requests with 10 concurrent
```
- **Purpose:** Simulate sudden burst of requests
- **Expected:** Most requests should be rate limited
- **Endpoint:** `/auth/register`
- **Rate Limit:** 3 registrations per hour

### **Test 3: Sustained Attack Simulation**
```bash
node security-tests/ddos-test.js sustained [duration] [rps]  
# Default: 30 seconds at 5 requests/second
```
- **Purpose:** Test system under sustained load
- **Expected:** Consistent rate limiting after initial burst
- **Endpoint:** `/auth/verify-email`
- **Rate Limit:** 5 verifications per 10 minutes

### **Test 4: Multi-endpoint Attack**
```bash
node security-tests/ddos-test.js multi-endpoint
```
- **Purpose:** Test rate limiting across different endpoints
- **Expected:** Each endpoint has independent rate limiting
- **Endpoints:** All auth endpoints
- **Different Limits:** Each endpoint has specific limits

### **Test 5: Account Lockout**
```bash
node security-tests/ddos-test.js lockout
```
- **Purpose:** Test account lockout mechanism  
- **Expected:** Account locks after 5 failed login attempts
- **Lockout Duration:** 30 minutes
- **Process:** Register → Multiple failed logins → Account locked

## 🎯 **Manual Testing Commands**

### **Quick Rate Limiting Test**
```bash
# Test login rate limiting (max 5 attempts per 15 minutes)
for i in {1..10}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
done
# 6th attempt should return 429 Too Many Requests
```

### **Test Registration Rate Limiting**  
```bash
# Test registration rate limiting (max 3 per hour)
for i in {1..5}; do
  curl -X POST http://localhost:3000/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"User$i\",\"email\":\"user$i@test.com\",\"password\":\"Test123!@#\"}"
  echo ""
done
# 4th attempt should return 429 Too Many Requests
```

### **Test Account Lockout**
```bash
# 1. Register user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"lockout@test.com","password":"CorrectPass123!@#"}'

# 2. Try wrong password 6 times
for i in {1..6}; do
  echo "Failed login attempt $i:"
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"lockout@test.com","password":"WrongPass"}'
  echo ""
done
# Account should be locked after 5 attempts
```

## 📈 **Monitoring Test Results**

### **Status Code Meanings:**
- **200/201**: Request successful ✅
- **400**: Bad request (validation error) ⚠️
- **401**: Unauthorized (wrong credentials) ⚠️  
- **403**: Forbidden (account locked) ⚠️
- **429**: Too Many Requests (rate limited) ✅ **← This is what we want!**
- **500**: Internal server error ❌

### **Watch Server Logs:**
Saat menjalankan tests, perhatikan di terminal server:
- Rate limiting kicks in
- Database queries for user lookouts  
- Account lockout events
- Failed login attempt tracking

### **Database Monitoring:**
```bash
# Check users table for lockout status
psql -d nest_auth -c "SELECT email, failedLoginAttempts, lockedUntil FROM users;"

# Check audit logs (if working)
psql -d nest_auth -c "SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT 10;"
```

## 🛠️ **Troubleshooting**

### **Server Not Running:**
```
❌ Server is not running! Start your NestJS server first.
```
**Solution:** Run `npm run start:dev` in project directory

### **Rate Limits Not Working:**  
```
✅ Successful: 50 (100%)
🚫 Rate Limited: 0 (0%)
```
**Solution:** Check ThrottlerModule configuration in app.module.ts

### **Audit Logging Errors:**
```
Audit logging failed: EntityMetadataNotFoundError: No metadata for "AuditLog" was found.
```
**Solution:** AuditLog entity sudah ditambahkan ke database config

### **Reset Testing Environment:**
```bash
# Clear rate limiting (restart server)
# Ctrl+C in server terminal, then:
npm run start:dev

# Clear test users from database  
psql -d nest_auth -c "DELETE FROM users WHERE email LIKE '%@test.com';"
psql -d nest_auth -c "DELETE FROM users WHERE email LIKE '%@ddos.com';"
```

## ⚠️ **Important Notes**

### **Testing Ethics:**
- ⚠️ **ONLY test your own systems**
- ⚠️ **DO NOT use these scripts against systems you don't own**
- ⚠️ **That would be illegal and unethical**

### **Testing Environment:**
- 🔧 Use development/testing environment
- 🔧 Don't test on production systems  
- 🔧 Have proper monitoring in place

## 🎉 **Success Criteria**

Your security implementation is working correctly if:

1. **Rate Limiting:** 70%+ of burst requests are blocked with 429 status
2. **Account Lockout:** Users get locked after 5 failed attempts  
3. **Code Expiry:** Verification codes expire after 15 minutes
4. **Response Times:** Rate-limited requests respond quickly (<50ms)
5. **No Crashes:** Server remains stable under load

**🎯 Target Security Score: 9/10** (Current implementation should achieve this!)

---

**🛡️ Sistem authentication sekarang siap ditest untuk ketahanan terhadap serangan DDoS!**
