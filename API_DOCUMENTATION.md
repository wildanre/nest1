# NestJS User Authentication API

API untuk sistem autentikasi pengguna dengan fitur lengkap termasuk registrasi, login, reset password, dan verifikasi email.

## Fitur

- ✅ **Registrasi Pengguna** - Pendaftaran dengan validasi email
- ✅ **Login/Logout** - Autentikasi dengan JWT
- ✅ **Verifikasi Email** - Konfirmasi email setelah registrasi
- ✅ **Reset Password** - Pemulihan password melalui email
- ✅ **Resend Verification** - Kirim ulang email verifikasi
- ✅ **Protected Routes** - Proteksi endpoint dengan JWT Guard
- ✅ **Validasi Data** - Validasi input dengan class-validator

## Teknologi

- **NestJS** - Framework Node.js
- **TypeORM** - ORM untuk database
- **MySQL** - Database
- **JWT** - JSON Web Token untuk autentikasi
- **Bcrypt** - Hashing password
- **Nodemailer** - Pengiriman email
- **Class Validator** - Validasi input

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Konfigurasi Database

Buat database MySQL baru:
```sql
CREATE DATABASE nestjs_auth;
```

### 3. Konfigurasi Environment Variables

Copy file `.env.example` ke `.env` dan sesuaikan konfigurasi:

```bash
cp .env.example .env
```

Edit file `.env` dengan konfigurasi Anda:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=nestjs_auth

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Email (contoh untuk Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Application
FROM_EMAIL=noreply@yourapp.com
FRONTEND_URL=http://localhost:3000
```

### 4. Konfigurasi Email (Gmail)

Untuk menggunakan Gmail sebagai SMTP:
1. Aktifkan 2-Factor Authentication di akun Gmail
2. Generate App Password di Google Account Settings
3. Gunakan App Password sebagai `SMTP_PASS`

### 5. Jalankan Aplikasi

```bash
# Development
pnpm run start:dev

# Production
pnpm run build
pnpm run start:prod
```

## API Endpoints

### Authentication Endpoints

#### 1. Register
**POST** `/auth/register`

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isEmailVerified": false,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2. Login
**POST** `/auth/login`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isEmailVerified": true,
    "isActive": true
  }
}
```

#### 3. Verify Email
**POST** `/auth/verify-email`

```json
{
  "token": "verification_token_from_email"
}
```

#### 4. Resend Verification
**POST** `/auth/resend-verification`

```json
{
  "email": "user@example.com"
}
```

#### 5. Forgot Password
**POST** `/auth/forgot-password`

```json
{
  "email": "user@example.com"
}
```

#### 6. Reset Password
**POST** `/auth/reset-password`

```json
{
  "token": "reset_token_from_email",
  "newPassword": "newpassword123"
}
```

#### 7. Get Profile (Protected)
**GET** `/auth/profile`

**Headers:**
```
Authorization: Bearer your_jwt_token
```

#### 8. Logout (Protected)
**POST** `/auth/logout`

**Headers:**
```
Authorization: Bearer your_jwt_token
```

## Struktur Database

### Table: users
- `id` (PRIMARY KEY, AUTO_INCREMENT)
- `email` (UNIQUE, NOT NULL)
- `password` (NOT NULL)
- `firstName` (NOT NULL)
- `lastName` (NOT NULL)
- `isEmailVerified` (BOOLEAN, DEFAULT FALSE)
- `emailVerificationToken` (NULLABLE)
- `emailVerificationExpires` (NULLABLE)
- `passwordResetToken` (NULLABLE)
- `passwordResetExpires` (NULLABLE)
- `isActive` (BOOLEAN, DEFAULT TRUE)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

## Security Features

1. **Password Hashing** - Menggunakan bcrypt dengan salt rounds 12
2. **JWT Authentication** - Token dengan expiry time
3. **Email Verification** - Wajib verifikasi email sebelum login
4. **Password Reset** - Token dengan expiry time (1 jam)
5. **Input Validation** - Validasi semua input dengan class-validator
6. **Rate Limiting** - Dapat ditambahkan throttler guard
7. **CORS Protection** - Konfigurasi CORS untuk frontend

## Testing

### Using cURL

#### Register
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

#### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Get Profile
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Error Handling

API mengembalikan error dalam format:
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials)
- `404` - Not Found
- `409` - Conflict (email already exists)
- `500` - Internal Server Error

## Production Deployment

1. Set `NODE_ENV=production` di environment variables
2. Gunakan strong JWT secret
3. Konfigurasi proper email service (SendGrid, AWS SES, dll)
4. Setup SSL/HTTPS
5. Konfigurasi reverse proxy (Nginx)
6. Setup monitoring dan logging
7. Regular database backup

## Pengembangan Lebih Lanjut

### Fitur yang bisa ditambahkan:
- [ ] Social Login (Google, Facebook)
- [ ] Two-Factor Authentication (2FA)
- [ ] Role-based Access Control (RBAC)
- [ ] API Rate Limiting
- [ ] Refresh Token
- [ ] Account Lockout setelah failed login
- [ ] Password Strength Requirements
- [ ] User Profile Management
- [ ] Admin Dashboard

### Optimasi:
- [ ] Caching dengan Redis
- [ ] Database Connection Pooling
- [ ] API Documentation dengan Swagger
- [ ] Unit dan Integration Tests
- [ ] Docker Containerization
- [ ] CI/CD Pipeline
