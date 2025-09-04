# Cloud Database Setup Guide

Aplikasi ini mendukung penggunaan cloud database seperti AWS RDS, Google Cloud SQL, Azure Database for MySQL, PlanetScale, atau cloud database MySQL lainnya.

## Konfigurasi Environment Variables

### Database Configuration

Untuk menggunakan cloud database, Anda perlu mengatur environment variables berikut di file `.env`:

```env
# Database Configuration (Cloud Database)
DB_HOST=your-cloud-db-host.com          # Host cloud database Anda
DB_PORT=3306                            # Port database (biasanya 3306 untuk MySQL)
DB_USERNAME=your-db-username            # Username database
DB_PASSWORD=your-db-password            # Password database
DB_NAME=nestjs_auth                     # Nama database

# SSL Configuration (Required untuk kebanyakan cloud database)
DB_SSL=true                             # Enable SSL
DB_SSL_REJECT_UNAUTHORIZED=true         # Set false jika menggunakan self-signed certificate

# Database Performance Settings
DB_SYNC=false                           # JANGAN set true di production!
DB_CONNECTION_LIMIT=10                  # Maksimal koneksi
DB_ACQUIRE_TIMEOUT=60000               # Timeout untuk mendapatkan koneksi (ms)
DB_TIMEOUT=60000                       # Timeout untuk query (ms)
DB_RETRY_ATTEMPTS=3                    # Jumlah retry jika koneksi gagal
DB_RETRY_DELAY=3000                    # Delay antar retry (ms)
```

## Setup untuk Provider Cloud Database Populer

### 1. PlanetScale

```env
DB_HOST=aws.connect.psdb.cloud
DB_PORT=3306
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_NAME=your-database-name
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

### 2. AWS RDS

```env
DB_HOST=your-instance.region.rds.amazonaws.com
DB_PORT=3306
DB_USERNAME=admin
DB_PASSWORD=your-password
DB_NAME=nestjs_auth
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

### 3. Google Cloud SQL

```env
DB_HOST=your-instance-ip
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your-password
DB_NAME=nestjs_auth
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

### 4. Azure Database for MySQL

```env
DB_HOST=your-server.mysql.database.azure.com
DB_PORT=3306
DB_USERNAME=your-username@your-server
DB_PASSWORD=your-password
DB_NAME=nestjs_auth
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

## Langkah-langkah Setup

### 1. Buat Database

Pastikan Anda sudah membuat database di cloud provider Anda dengan nama sesuai `DB_NAME`.

### 2. Setup Environment Variables

Copy file `.env.example` ke `.env` dan sesuaikan dengan kredensial cloud database Anda:

```bash
cp .env.example .env
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Migration (Hanya untuk pertama kali)

Untuk setup awal, Anda bisa menggunakan synchronize:

```env
DB_SYNC=true  # Hanya untuk setup awal
```

**PENTING**: Setelah database terbuat, ubah kembali ke `DB_SYNC=false` untuk production!

### 5. Jalankan Aplikasi

```bash
# Development
pnpm run start:dev

# Production
pnpm run build
pnpm run start:prod
```

## Keamanan Production

### Environment Variables untuk Production

```env
# Database
DB_SYNC=false                          # WAJIB false di production!
DB_SSL=true                            # WAJIB true untuk cloud database
DB_SSL_REJECT_UNAUTHORIZED=true        # WAJIB true untuk keamanan

# JWT
JWT_SECRET=your-very-secure-secret-key-min-32-chars
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
FROM_EMAIL=noreply@yourdomain.com

# Application
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

## Monitoring & Performance

### Connection Pool Settings

Sesuaikan berdasarkan limit cloud database Anda:

```env
DB_CONNECTION_LIMIT=10                 # Sesuaikan dengan limit provider
DB_ACQUIRE_TIMEOUT=60000              # 60 detik
DB_TIMEOUT=60000                      # 60 detik
```

### Logging

Di production, logging database akan otomatis dimatikan. Untuk development:

```env
DB_LOGGING=true                       # Enable query logging
```

## Troubleshooting

### Connection Timeout

Jika mengalami timeout:

1. Periksa firewall settings di cloud provider
2. Pastikan IP server diwhitelist
3. Tingkatkan timeout values:

```env
DB_ACQUIRE_TIMEOUT=120000             # 2 menit
DB_TIMEOUT=120000                     # 2 menit
DB_CONNECTION_TIMEOUT=120000          # 2 menit
```

### SSL Certificate Issues

Jika ada masalah SSL certificate:

```env
DB_SSL_REJECT_UNAUTHORIZED=false      # Hanya untuk testing!
```

### Too Many Connections

Kurangi connection limit:

```env
DB_CONNECTION_LIMIT=5                 # Kurangi jika terlalu banyak koneksi
```

## Backup & Migration

### Backup

Untuk backup database, gunakan tools yang disediakan cloud provider atau:

```bash
mysqldump -h $DB_HOST -u $DB_USERNAME -p$DB_PASSWORD $DB_NAME > backup.sql
```

### Migration dari Local ke Cloud

1. Export data dari local database
2. Import ke cloud database
3. Update environment variables
4. Test koneksi

```bash
# Export from local
mysqldump -u root -p nestjs_auth > local_backup.sql

# Import to cloud
mysql -h $DB_HOST -u $DB_USERNAME -p$DB_PASSWORD $DB_NAME < local_backup.sql
```
