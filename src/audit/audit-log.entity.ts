import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: number;

  @Column()
  action: string; // 'LOGIN', 'REGISTER', 'PASSWORD_RESET', etc.

  @Column()
  resource: string; // 'user', 'auth', etc.

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ type: 'json', nullable: true })
  metadata: any; // Additional context data

  @Column({ default: 'SUCCESS' })
  status: string; // 'SUCCESS', 'FAILED', 'BLOCKED'

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}
