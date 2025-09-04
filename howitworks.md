# How It Works - NestJS Authentication Backend

## Arsitektur Sistem

Aplikasi ini menggunakan arsitektur **NestJS** dengan pola **Module-Based Architecture** yang terdiri dari beberapa modul utama:

```
nest1/ (Root Project)
├── 📄 Configuration Files
│   ├── package.json              # Dependencies & scripts
│   ├── nest-cli.json            # NestJS CLI configuration
│   ├── tsconfig.json            # TypeScript configuration
│   ├── .env                     # Environment variables
│   └── eslint.config.mjs        # ESLint configuration
│
├── 📚 Documentation
│   ├── README.md                # Project overview
│   ├── API_DOCUMENTATION.md     # API endpoints documentation
│   ├── howitworks.md           # Backend architecture guide (this file)
│   ├── TEST_ENDPOINTS.md       # Testing guide
│   ├── CLOUD_DATABASE_SETUP.md # Database setup guide
│   └── FRONTEND_TESTING.md     # Frontend testing guide
│
├── 🚀 Source Code (src/)
│   ├── main.ts                  # Application entry point
│   ├── app.module.ts           # Root application module
│   ├── app.controller.ts       # Root controller
│   ├── app.service.ts          # Root service
│   │
│   ├── 🔐 auth/ (Authentication Module)
│   │   ├── auth.module.ts       # Auth module configuration
│   │   ├── auth.controller.ts   # HTTP endpoints handler
│   │   ├── auth.service.ts      # Business logic
│   │   ├── dto/
│   │   │   └── auth.dto.ts      # Data transfer objects
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts    # JWT protection
│   │   │   └── local-auth.guard.ts  # Local auth
│   │   └── strategies/
│   │       ├── jwt.strategy.ts      # JWT strategy
│   │       └── local.strategy.ts    # Local strategy
│   │
│   ├── 👥 users/ (Users Module)
│   │   ├── users.module.ts      # Users module configuration
│   │   ├── users.service.ts     # User database operations
│   │   └── user.entity.ts       # User database entity
│   │
│   ├── 📧 email/ (Email Module)
│   │   ├── email.module.ts      # Email module configuration
│   │   └── email.service.ts     # Email sending operations
│   │
│   └── ⚙️ config/
│       └── database.config.ts   # Database configuration
│
├── 🧪 Testing
│   ├── test/
│   │   ├── app.e2e-spec.ts     # End-to-end tests
│   │   └── jest-e2e.json       # Jest E2E configuration
│   └── src/**/*.spec.ts        # Unit tests
│
└── 🌐 Frontend (Optional)
    └── frontend/
        ├── index.html          # Main HTML file
        ├── styles.css          # Styling
        └── script.js           # JavaScript logic
```

---

## 1. Database Schema & Design

### Neon PostgreSQL Cloud Database
Menggunakan **Neon PostgreSQL** sebagai database cloud dengan konfigurasi:
- **Host**: `ep-weathered-star-a1jqmeil-pooler.ap-southeast-1.aws.neon.tech`
- **SSL**: Required
- **Connection Pooling**: Enabled
- **Auto-scaling**: Serverless PostgreSQL

### User Entity (`src/users/user.entity.ts`)
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  // 6-digit verification codes
  @Column({ type: 'varchar', length: 6, nullable: true })
  emailVerificationCode: string;

  @Column({ type: 'varchar', length: 6, nullable: true })
  passwordResetCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Perubahan Penting:**
- ❌ `emailVerificationToken` (string panjang)
- ✅ `emailVerificationCode` (6 digit varchar)
- ❌ `passwordResetToken` (string panjang)
- ✅ `passwordResetCode` (6 digit varchar)

---

## 2. Struktur Folder & File

### 📁 `src/auth/` - Authentication Module

#### `auth.module.ts` - Module Configuration
```typescript
@Module({
  imports: [
    UsersModule,           // Import users module
    EmailModule,           // Import email module
    PassportModule,        // Passport authentication
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
```

#### `auth.controller.ts` - HTTP Endpoints
Menangani semua HTTP requests untuk authentication:

```typescript
@Controller('auth')
export class AuthController {
  // POST /auth/register
  @Post('register')
  async register(@Body() registerDto: RegisterDto)

  // POST /auth/login
  @Post('login')
  async login(@Body() loginDto: LoginDto)

  // POST /auth/verify-email
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto)

  // POST /auth/forgot-password
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto)

  // POST /auth/reset-password
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto)

  // POST /auth/resend-verification
  @Post('resend-verification')
  async resendVerification(@Body() resendVerificationDto: ResendVerificationDto)

  // GET /auth/profile (Protected with JWT)
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req)

  // POST /auth/logout (Protected with JWT)
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req)
}
```

#### `auth.service.ts` - Business Logic
Menangani semua logic bisnis authentication:

```typescript
@Injectable()
export class AuthService {
  // Registrasi user baru
  async register(registerDto: RegisterDto) {
    // 1. Hash password dengan bcrypt
    // 2. Generate 6-digit verification code
    // 3. Simpan user ke database
    // 4. Kirim email verification
    // 5. Return user data (tanpa password)
  }

  // Login user
  async login(loginDto: LoginDto) {
    // 1. Validasi email & password
    // 2. Check apakah email sudah diverifikasi
    // 3. Generate JWT token
    // 4. Return token & user data
  }

  // Verifikasi email dengan 6-digit code
  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    // 1. Cari user berdasarkan verification code
    // 2. Validasi code masih valid
    // 3. Update isEmailVerified = true
    // 4. Clear verification code
  }

  // Request password reset
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    // 1. Cari user berdasarkan email
    // 2. Generate 6-digit reset code
    // 3. Simpan reset code ke database
    // 4. Kirim email dengan reset code
  }

  // Reset password dengan code
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    // 1. Cari user berdasarkan reset code
    // 2. Validasi code masih valid
    // 3. Hash password baru
    // 4. Update password & clear reset code
  }
}
```

#### `dto/auth.dto.ts` - Data Transfer Objects
Validasi input dari client:

```typescript
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}

export class VerifyEmailDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/) // Hanya 6 digit angka
  code: string;
}

export class ResetPasswordDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/) // Hanya 6 digit angka
  code: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
```

### 📁 `src/users/` - Users Module

#### `users.service.ts` - User Database Operations
```typescript
@Injectable()
export class UsersService {
  // Generate 6-digit random code
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create user baru
  async create(createUserDto: CreateUserDto): Promise<User> {
    const code = this.generateCode();
    const user = this.userRepository.create({
      ...createUserDto,
      emailVerificationCode: code,
    });
    return await this.userRepository.save(user);
  }

  // Generate verification code baru
  async generateEmailVerificationCode(userId: string): Promise<string> {
    const code = this.generateCode();
    await this.userRepository.update(userId, {
      emailVerificationCode: code,
    });
    return code;
  }

  // Generate password reset code
  async generatePasswordResetCode(userId: string): Promise<string> {
    const code = this.generateCode();
    await this.userRepository.update(userId, {
      passwordResetCode: code,
    });
    return code;
  }

  // Cari user berdasarkan verification code
  async findByEmailVerificationCode(code: string): Promise<User> {
    return await this.userRepository.findOne({
      where: { emailVerificationCode: code }
    });
  }

  // Cari user berdasarkan reset code
  async findByPasswordResetCode(code: string): Promise<User> {
    return await this.userRepository.findOne({
      where: { passwordResetCode: code }
    });
  }
}
```

### 📁 `src/email/` - Email Module

#### `email.service.ts` - Email Operations
```typescript
@Injectable()
export class EmailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransporter({
      host: this.configService.get('EMAIL_HOST'),
      port: this.configService.get('EMAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    });
  }

  // Kirim email verification dengan 6-digit code
  async sendVerificationEmail(email: string, code: string) {
    const htmlTemplate = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial;">
        <h2>Verify Your Email</h2>
        <p>Your 6-digit verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; color: #007bff; 
                    text-align: center; padding: 20px; background: #f8f9fa; 
                    border-radius: 8px; letter-spacing: 8px;">
          ${code}
        </div>
        <p>This code is valid for email verification.</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to: email,
      subject: 'Verify Your Email - Your 6-Digit Code',
      html: htmlTemplate,
    });
  }

  // Kirim email password reset dengan 6-digit code
  async sendPasswordResetEmail(email: string, code: string) {
    const htmlTemplate = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial;">
        <h2>Reset Your Password</h2>
        <p>Your 6-digit password reset code is:</p>
        <div style="font-size: 32px; font-weight: bold; color: #dc3545; 
                    text-align: center; padding: 20px; background: #f8f9fa; 
                    border-radius: 8px; letter-spacing: 8px;">
          ${code}
        </div>
        <p>Use this code to reset your password.</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to: email,
      subject: 'Reset Your Password - Your 6-Digit Code',
      html: htmlTemplate,
    });
  }
}
```

---

## 3. Alur Kerja (Workflow)

### 🔄 **Flow 1: User Registration**
```
┌─────────────┐    POST /auth/register    ┌─────────────────┐
│   Client    │ ─────────────────────────→ │ AuthController  │
│  (Frontend) │                           │   .register()   │
└─────────────┘                           └─────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │   AuthService   │
                                          │   .register()   │
                                          └─────────────────┘
                                                   │
                                   ┌───────────────┼───────────────┐
                                   ▼               ▼               ▼
                            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                            │   bcrypt    │ │ UsersService│ │EmailService │
                            │ .hash(pwd)  │ │  .create()  │ │.sendVerify()│
                            └─────────────┘ └─────────────┘ └─────────────┘
                                                   │               │
                                                   ▼               ▼
                                          ┌─────────────────┐ ┌─────────────┐
                                          │ PostgreSQL DB   │ │ Gmail SMTP  │
                                          │ Save User +     │ │ Send Email  │
                                          │ 6-digit Code    │ │ with Code   │
                                          └─────────────────┘ └─────────────┘
```

### 🔄 **Flow 2: Email Verification**
```
┌─────────────┐                          ┌─────────────────┐
│    User     │ ← Email with 6-digit ──── │ EmailService    │
│ Gets Email  │    Code: "123456"         │ (Gmail SMTP)    │
└─────────────┘                          └─────────────────┘
       │
       │ User inputs code in frontend
       ▼
┌─────────────┐   POST /auth/verify-email ┌─────────────────┐
│   Client    │ ─────────────────────────→ │ AuthController  │
│  (Frontend) │   { code: "123456" }      │  .verifyEmail() │
└─────────────┘                           └─────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │   AuthService   │
                                          │  .verifyEmail() │
                                          └─────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │ UsersService    │
                                          │.findByEmailCode │
                                          └─────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │ PostgreSQL DB   │
                                          │ UPDATE users    │
                                          │ SET verified=true│
                                          │ code=null       │
                                          └─────────────────┘
```

### 🔄 **Flow 3: User Login**
```
┌─────────────┐     POST /auth/login      ┌─────────────────┐
│   Client    │ ─────────────────────────→ │ AuthController  │
│  (Frontend) │  { email, password }      │    .login()     │
└─────────────┘                           └─────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │   AuthService   │
                                          │    .login()     │
                                          └─────────────────┘
                                                   │
                                   ┌───────────────┼───────────────┐
                                   ▼               ▼               ▼
                            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                            │UsersService │ │   bcrypt    │ │ JwtService  │
                            │.findByEmail │ │ .compare()  │ │  .sign()    │
                            └─────────────┘ └─────────────┘ └─────────────┘
                                   │               │               │
                                   ▼               ▼               ▼
                            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                            │PostgreSQL DB│ │ Password    │ │ JWT Token   │
                            │ Get User    │ │ Validation  │ │ Generated   │
                            └─────────────┘ └─────────────┘ └─────────────┘
                                                                   │
                                                                   ▼
                                                          ┌─────────────────┐
                                                          │ Return to Client│
                                                          │ { access_token, │
                                                          │   user_data }   │
                                                          └─────────────────┘
```

### 🔄 **Flow 4: Password Reset (2-Step Process)**

#### Step 1: Request Reset Code
```
┌─────────────┐  POST /auth/forgot-password ┌─────────────────┐
│   Client    │ ─────────────────────────→  │ AuthController  │
│  (Frontend) │    { email }               │.forgotPassword()│
└─────────────┘                            └─────────────────┘
                                                    │
                                                    ▼
                                           ┌─────────────────┐
                                           │   AuthService   │
                                           │.forgotPassword()│
                                           └─────────────────┘
                                                    │
                                    ┌───────────────┼───────────────┐
                                    ▼               ▼               ▼
                            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                            │UsersService │ │UsersService │ │EmailService │
                            │.findByEmail │ │.generateReset│ │.sendReset() │
                            └─────────────┘ └─────────────┘ └─────────────┘
                                    │               │               │
                                    ▼               ▼               ▼
                            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                            │PostgreSQL DB│ │PostgreSQL DB│ │ Gmail SMTP  │
                            │ Find User   │ │ Save Reset  │ │ Send Email  │
                            │             │ │ Code        │ │ with Code   │
                            └─────────────┘ └─────────────┘ └─────────────┘
```

#### Step 2: Reset with Code
```
┌─────────────┐                          ┌─────────────────┐
│    User     │ ← Email with reset ────── │ EmailService    │
│ Gets Email  │    Code: "123456"        │ (Gmail SMTP)    │
└─────────────┘                          └─────────────────┘
       │
       │ User inputs code + new password
       ▼
┌─────────────┐  POST /auth/reset-password ┌─────────────────┐
│   Client    │ ─────────────────────────→ │ AuthController  │
│  (Frontend) │{ code, newPassword }      │ .resetPassword()│
└─────────────┘                           └─────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │   AuthService   │
                                          │ .resetPassword()│
                                          └─────────────────┘
                                                   │
                                   ┌───────────────┼───────────────┐
                                   ▼               ▼               ▼
                            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                            │UsersService │ │   bcrypt    │ │UsersService │
                            │.findByReset │ │ .hash(new)  │ │ .update()   │
                            │    Code     │ │  password   │ │  password   │
                            └─────────────┘ └─────────────┘ └─────────────┘
                                   │               │               │
                                   ▼               ▼               ▼
                            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                            │PostgreSQL DB│ │ Hashed Pass │ │PostgreSQL DB│
                            │ Find User   │ │ Generated   │ │ Update Pass │
                            │ by Code     │ │             │ │ Clear Code  │
                            └─────────────┘ └─────────────┘ └─────────────┘
```

### 🔄 **Flow 5: Protected Routes (JWT Authentication)**
```
┌─────────────┐    GET /auth/profile      ┌─────────────────┐
│   Client    │ ─────────────────────────→ │ JwtAuthGuard    │
│  (Frontend) │ Authorization: Bearer     │ (Middleware)    │
│             │ <jwt_token>               │                 │
└─────────────┘                           └─────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │  JwtStrategy    │
                                          │ .validate()     │
                                          │ Decode Token    │
                                          └─────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │ AuthController  │
                                          │ .getProfile()   │
                                          │ (Protected)     │
                                          └─────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │ Return User     │
                                          │ Profile Data    │
                                          │ (No Password)   │
                                          └─────────────────┘
```

---

## 4. Security Features

### 🔐 **Password Security**
- **bcrypt hashing** dengan salt rounds (default 10)
- **Minimum 6 characters** untuk password
- Password tidak pernah di-return dalam response

### 🔐 **JWT Token Security**
- **24 jam expiry** untuk access token
- **Secret key** dari environment variables
- **Bearer token** authentication
- Token validation pada protected routes

### 🔐 **6-Digit Code Security**
- **Random generation** menggunakan `Math.random()`
- **6 digit angka** (100000-999999)
- **Single use** - code dihapus setelah digunakan
- **No expiry time** - valid sampai digunakan

### 🔐 **Input Validation**
- **class-validator** untuk validasi DTO
- **Email format** validation
- **Code format** validation (exactly 6 digits)
- **SQL injection** protection via TypeORM

### 🔐 **Database Security**
- **SSL connection** ke Neon PostgreSQL
- **Connection pooling** untuk performance
- **Environment variables** untuk credentials
- **UUID primary keys** untuk better security

---

## 5. Configuration & Environment

### 📝 **Environment Variables (`.env`)**
```env
# Database Configuration
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### 📝 **Main Configuration (`main.ts`)**
```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS Configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      /^file:\/\//  // Allow local file protocol
    ],
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  await app.listen(3000);
}
```

---

## 6. Keunggulan Sistem 6-Digit Code

### ✅ **Vs Email Links (Token-based)**
| Feature | 6-Digit Code | Email Links |
|---------|--------------|-------------|
| **Security** | ✅ Shorter, harder to guess | ❌ Long tokens in URL |
| **UX** | ✅ Copy-paste friendly | ❌ Click dependency |
| **Mobile** | ✅ Easy to read on mobile | ❌ Link formatting issues |
| **Email Clients** | ✅ No link blocking | ❌ Often blocked |
| **Expiry** | ✅ Single use | ❌ Time-based expiry |

### ✅ **Benefits**
- **Better Security**: Codes tidak bisa di-guess atau di-brute force
- **Better UX**: User tinggal copy-paste, tidak perlu klik link
- **Mobile Friendly**: Mudah dibaca di aplikasi email mobile
- **No URL Issues**: Tidak ada masalah dengan email client yang block links
- **Simpler Logic**: Tidak perlu handle expiry time, langsung invalid setelah digunakan

---

## 7. Testing & Debugging

### 🧪 **Manual Testing Endpoints**
```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","firstName":"Test","lastName":"User"}'

# Verify Email (check your email for code)
curl -X POST http://localhost:3000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"code":"123456"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### 🐛 **Common Issues & Solutions**
1. **Database Connection**: Check DATABASE_URL format
2. **Email Not Sending**: Verify Gmail app password
3. **CORS Error**: Check frontend origin in CORS config
4. **JWT Error**: Verify JWT_SECRET is set
5. **Code Not Working**: Check 6-digit format validation

---

## 8. Deployment Ready

Sistem ini siap untuk production dengan:
- ✅ **Cloud Database** (Neon PostgreSQL)
- ✅ **Environment Variables** for security
- ✅ **Error Handling** yang konsisten
- ✅ **Input Validation** lengkap
- ✅ **CORS** configuration
- ✅ **JWT** authentication
- ✅ **Email Templates** yang styled
- ✅ **Frontend** yang responsive

---

## 9. Dependency Injection & Module Relationships

### 🔗 **Module Dependencies Map**
```
┌─────────────────────────────────────────────────────────────┐
│                        AppModule                            │
│                     (Root Module)                           │
└─────────────────┬───────────────┬───────────────────────────┘
                  │               │
                  ▼               ▼
         ┌─────────────────┐ ┌─────────────────┐
         │   ConfigModule  │ │ TypeOrmModule   │
         │ (Environment)   │ │  (Database)     │
         └─────────────────┘ └─────────────────┘
                  │               │
                  ▼               ▼
         ┌─────────────────────────────────────┐
         │            AuthModule               │
         │        (Authentication)             │
         └─────────────┬───────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ UsersModule │ │EmailModule  │ │PassportModule│
│   (Users)   │ │  (Email)    │ │   (Auth)    │
└─────────────┘ └─────────────┘ └─────────────┘
```

### 🔗 **Service Dependencies**
```
AuthService
├── UsersService (Database operations)
├── EmailService (Email sending)
├── JwtService (Token generation)
└── ConfigService (Environment variables)

UsersService
├── UserRepository (TypeORM)
└── ConfigService (Database config)

EmailService
├── NodeMailer (Email transport)
└── ConfigService (SMTP config)
```

### 🔗 **Provider Injection Examples**
```typescript
// AuthService dependencies
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,      // Users operations
    private emailService: EmailService,     // Email sending
    private jwtService: JwtService,         // JWT token handling
    private configService: ConfigService,   // Environment config
  ) {}
}

// UsersService dependencies
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>, // TypeORM repository
  ) {}
}

// EmailService dependencies
@Injectable()
export class EmailService {
  constructor(
    private configService: ConfigService,    // SMTP configuration
  ) {}
}
```

---

## 10. Database Operations Deep Dive

### 📊 **TypeORM Repository Pattern**
```typescript
// UsersService menggunakan Repository Pattern
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // CREATE operations
  async create(userData: CreateUserDto): Promise<User> {
    const code = this.generateCode();
    const user = this.userRepository.create({
      ...userData,
      emailVerificationCode: code,
    });
    return await this.userRepository.save(user);
  }

  // READ operations
  async findByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async findByEmailVerificationCode(code: string): Promise<User> {
    return await this.userRepository.findOne({
      where: { emailVerificationCode: code },
    });
  }

  // UPDATE operations
  async verifyEmail(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      isEmailVerified: true,
      emailVerificationCode: null,
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userRepository.update(userId, {
      password: hashedPassword,
      passwordResetCode: null,
    });
  }
}
```

### 📊 **Database Queries Generated**
```sql
-- User Registration
INSERT INTO users (
  id, email, password, firstName, lastName, 
  emailVerificationCode, isEmailVerified, isActive, 
  createdAt, updatedAt
) VALUES (
  uuid_generate_v4(), 'user@email.com', '$2b$10$...', 
  'John', 'Doe', '123456', false, true, 
  NOW(), NOW()
);

-- Find by Verification Code
SELECT * FROM users 
WHERE emailVerificationCode = '123456' 
AND isActive = true;

-- Email Verification
UPDATE users 
SET isEmailVerified = true, 
    emailVerificationCode = NULL,
    updatedAt = NOW()
WHERE id = 'user-uuid';

-- Password Reset
UPDATE users 
SET password = '$2b$10$...', 
    passwordResetCode = NULL,
    updatedAt = NOW()
WHERE passwordResetCode = '654321';
```

---

## 11. Error Handling & Validation

### ⚠️ **Exception Filters**
```typescript
// Global Exception Handler
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Remove unknown properties
  forbidNonWhitelisted: true, // Throw error for unknown properties
  transform: true,           // Transform to DTO classes
  exceptionFactory: (errors) => {
    return new BadRequestException(errors);
  },
}));
```

### ⚠️ **Custom Exceptions**
```typescript
// Di AuthService
if (!user) {
  throw new UnauthorizedException('Invalid credentials');
}

if (!user.isEmailVerified) {
  throw new UnauthorizedException('Please verify your email first');
}

if (!user.isActive) {
  throw new UnauthorizedException('Account is deactivated');
}
```

### ⚠️ **DTO Validation**
```typescript
export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;
}

export class VerifyEmailDto {
  @IsString({ message: 'Code must be a string' })
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Code must contain only numbers' })
  code: string;
}
```

---

## 12. Performance & Optimization

### ⚡ **Connection Pooling**
```typescript
// Database configuration
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    url: configService.get('DATABASE_URL'),
    ssl: { rejectUnauthorized: false },
    // Connection pooling for performance
    extra: {
      max: 20,              // Maximum connections in pool
      min: 5,               // Minimum connections in pool
      idle_timeout: 30000,  // Close idle connections after 30s
    },
    synchronize: false,     // Don't auto-sync in production
    logging: false,         // Disable query logging in production
  }),
  inject: [ConfigService],
});
```

### ⚡ **Caching Strategy**
```typescript
// Future implementation ideas
@Injectable()
export class UsersService {
  // Cache frequently accessed users
  private userCache = new Map<string, User>();

  async findByEmail(email: string): Promise<User> {
    // Check cache first
    if (this.userCache.has(email)) {
      return this.userCache.get(email);
    }
    
    // Fetch from database
    const user = await this.userRepository.findOne({ where: { email } });
    
    // Cache the result
    if (user) {
      this.userCache.set(email, user);
    }
    
    return user;
  }
}
```

### ⚡ **Email Queue (Future Enhancement)**
```typescript
// For high-volume email sending
import { Queue } from 'bull';

@Injectable()
export class EmailService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  async sendVerificationEmail(email: string, code: string) {
    // Add to queue instead of sending immediately
    await this.emailQueue.add('verification', {
      email,
      code,
      template: 'verification',
    });
  }
}
```
