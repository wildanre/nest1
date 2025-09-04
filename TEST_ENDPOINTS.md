# Test API Endpoints

## 1. Test Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

## 2. Test Login (setelah verifikasi email)
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123"
  }'
```

## 3. Test Verify Email
```bash
curl -X POST http://localhost:3000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_VERIFICATION_TOKEN_FROM_EMAIL"
  }'
```

## 4. Test Resend Verification
```bash
curl -X POST http://localhost:3000/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com"
  }'
```

## 5. Test Forgot Password
```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com"
  }'
```

## 6. Test Reset Password
```bash
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_RESET_TOKEN_FROM_EMAIL",
    "newPassword": "newpassword123"
  }'
```

## 7. Test Get Profile (Protected Route)
```bash
# Ganti YOUR_JWT_TOKEN dengan token yang didapat dari login
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 8. Test Logout
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Test dengan Postman

Anda juga bisa mengimpor collection Postman dengan endpoints berikut:

### Register
- Method: POST
- URL: http://localhost:3000/auth/register
- Body (JSON):
```json
{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "Test",
  "lastName": "User"
}
```

### Login
- Method: POST
- URL: http://localhost:3000/auth/login
- Body (JSON):
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

### Protected Routes
- Header: Authorization: Bearer {{jwt_token}}

## Flow Testing

1. **Register** user baru
2. **Cek email** untuk verification token
3. **Verify email** dengan token
4. **Login** dengan kredensial
5. **Akses protected route** dengan JWT token
6. **Test forgot password** flow
7. **Test reset password** flow
