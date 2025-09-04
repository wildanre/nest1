# User Authentication API - Test Endpoints

Base URL: `http://localhost:3000`

## Available Endpoints

### 1. Register User
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 2. Login User
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 3. Forgot Password
```bash
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 4. Reset Password
```bash
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "newpassword123"
}
```

### 5. Verify Email
```bash
POST /auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-from-email"
}
```

### 6. Resend Verification Email
```bash
POST /auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 7. Get User Profile (Protected)
```bash
GET /auth/profile
Authorization: Bearer {your-jwt-token}
```

### 8. Logout (Protected)
```bash
POST /auth/logout
Authorization: Bearer {your-jwt-token}
```

## cURL Examples

### Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Profile (setelah login)
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Response Examples

### Successful Registration
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "isEmailVerified": false,
    "isActive": true,
    "createdAt": "2025-09-04T13:22:44.123Z",
    "updatedAt": "2025-09-04T13:22:44.123Z"
  }
}
```

### Successful Login
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "isEmailVerified": true,
    "isActive": true,
    "createdAt": "2025-09-04T13:22:44.123Z",
    "updatedAt": "2025-09-04T13:22:44.123Z"
  }
}
```

### User Profile
```json
{
  "id": 1,
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "User",
  "isEmailVerified": true,
  "isActive": true,
  "createdAt": "2025-09-04T13:22:44.123Z",
  "updatedAt": "2025-09-04T13:22:44.123Z"
}
```

## Status Aplikasi

✅ **Aplikasi berjalan di**: http://localhost:3000  
✅ **Database**: Neon PostgreSQL Cloud Database  
✅ **Environment**: Development mode dengan hot reload  
✅ **Semua endpoint**: Sudah tersedia dan ready untuk testing  

## Testing dengan Postman atau Insomnia

1. Import collection atau buat request manual
2. Test endpoint `/auth/register` terlebih dahulu
3. Untuk test email verification, cek email yang Anda gunakan
4. Test endpoint `/auth/login` dengan user yang sudah terverifikasi
5. Gunakan JWT token dari login untuk mengakses protected routes

## Catatan Email

- Email verification dan password reset memerlukan konfigurasi SMTP
- Update environment variables untuk email:
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-email@gmail.com
  SMTP_PASS=your-app-password
  FROM_EMAIL=noreply@yourapp.com
  ```
