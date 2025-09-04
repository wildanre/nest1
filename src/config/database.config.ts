import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/user.entity';

export const databaseConfig = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User],
    synchronize: process.env.DB_SYNC === 'true', // Only true for development
    logging: !isProduction && process.env.DB_LOGGING !== 'false',
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    } : false,
    extra: {
      max: parseInt(process.env.DB_CONNECTION_LIMIT || '10'), // PostgreSQL uses 'max' instead of 'connectionLimit'
      connectionTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
      query_timeout: parseInt(process.env.DB_TIMEOUT || '60000'),
      statement_timeout: parseInt(process.env.DB_TIMEOUT || '60000'),
    },
    // Retry connection on failure
    retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '3000'),
  };
};
