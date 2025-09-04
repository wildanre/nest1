import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Generate 6-digit crypto-secure random code
  private generateSecureCode(): string {
    return randomInt(100000, 999999).toString();
  }

  // Generate code expiry time (15 minutes from now)
  private generateCodeExpiry(): Date {
    const now = new Date();
    return new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
  }

  async create(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const emailVerificationCode = this.generateSecureCode();
    const emailVerificationExpires = this.generateCodeExpiry();

    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
      emailVerificationCode,
      emailVerificationExpires,
    });

    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async generatePasswordResetToken(email: string): Promise<string> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetCode = this.generateSecureCode();
    const resetExpires = this.generateCodeExpiry();

    user.passwordResetCode = resetCode;
    user.passwordResetExpires = resetExpires;

    await this.usersRepository.save(user);
    return resetCode;
  }

  async resetPassword(code: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: {
        passwordResetCode: code,
        passwordResetExpires: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired reset code');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.passwordResetCode = null;
    user.passwordResetExpires = null;

    await this.usersRepository.save(user);
  }

  async verifyEmail(code: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: {
        emailVerificationCode: code,
        emailVerificationExpires: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired verification code');
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;

    await this.usersRepository.save(user);
  }

  async generateNewVerificationToken(email: string): Promise<string> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new ConflictException('Email already verified');
    }

    const emailVerificationCode = this.generateSecureCode();
    const emailVerificationExpires = this.generateCodeExpiry();

    user.emailVerificationCode = emailVerificationCode;
    user.emailVerificationExpires = emailVerificationExpires;

    await this.usersRepository.save(user);
    return emailVerificationCode;
  }

  async updateRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.usersRepository.update(userId, {
      refreshToken,
      refreshTokenExpires,
    });
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { 
        refreshToken,
        refreshTokenExpires: MoreThan(new Date()),
        isActive: true
      },
    });
  }

  async clearRefreshToken(userId: number): Promise<void> {
    await this.usersRepository.update(userId, {
      refreshToken: null,
      refreshTokenExpires: null,
    });
  }

  async incrementFailedLoginAttempts(userId: number): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;

    const attempts = user.failedLoginAttempts + 1;
    const updateData: any = { failedLoginAttempts: attempts };

    // Lock account after 5 failed attempts for 30 minutes
    if (attempts >= 5) {
      updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }

    await this.usersRepository.update(userId, updateData);
  }

  async resetFailedLoginAttempts(userId: number): Promise<void> {
    await this.usersRepository.update(userId, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }

  async isAccountLocked(userId: number): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) return false;

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return true;
    }

    // Auto-unlock if lock period has passed
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.resetFailedLoginAttempts(userId);
      return false;
    }

    return false;
  }
}
