import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

export interface AuditLogData {
  userId?: number;
  action: string;
  resource: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  status?: string;
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        ...data,
        status: data.status || 'SUCCESS',
      });
      await this.auditRepository.save(auditLog);
    } catch (error) {
      // Don't throw errors for audit logging to avoid breaking main flow
      console.error('Audit logging failed:', error);
    }
  }

  async logUserAction(
    userId: number,
    action: string,
    resource: string,
    metadata?: any,
    status: string = 'SUCCESS'
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource,
      metadata,
      status,
    });
  }

  async logSecurityEvent(
    action: string,
    ipAddress: string,
    userAgent: string,
    metadata?: any,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      action,
      resource: 'security',
      ipAddress,
      userAgent,
      metadata,
      status: 'FAILED',
      errorMessage,
    });
  }

  async getRecentFailedAttempts(ipAddress: string, minutes: number = 60): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    
    const count = await this.auditRepository.count({
      where: {
        ipAddress,
        status: 'FAILED',
        action: 'LOGIN',
        createdAt: since as any,
      },
    });

    return count;
  }

  async getUserActivityHistory(userId: number, limit: number = 50): Promise<AuditLog[]> {
    return await this.auditRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
