import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { AuditModule } from './audit/audit.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 10,   // 10 requests per minute
      },
      {
        name: 'medium', 
        ttl: 300000, // 5 minutes
        limit: 50,   // 50 requests per 5 minutes
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour
        limit: 200,   // 200 requests per hour
      },
    ]),
    TypeOrmModule.forRoot(databaseConfig()),
    AuthModule,
    UsersModule,
    EmailModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
