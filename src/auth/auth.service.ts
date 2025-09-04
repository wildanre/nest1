import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto, ResendVerificationDto } from './dto/auth.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string; user: Partial<User> }> {
    const user = await this.usersService.create(registerDto);
    
    // Send verification email with 6-digit code
    if (user.emailVerificationCode) {
      await this.emailService.sendVerificationEmail(user.email, user.emailVerificationCode);
    }

    // Return user without sensitive data
    const { password, emailVerificationCode, passwordResetCode, ...userResponse } = user;
    
    return {
      message: 'Registration successful. Please check your email for verification code.',
      user: userResponse,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await this.usersService.validatePassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(user: User): Promise<{ access_token: string; user: Partial<User> }> {
    const payload = { email: user.email, sub: user.id };
    
    // Return user without sensitive data
    const { password, emailVerificationCode, passwordResetCode, ...userResponse } = user;
    
    return {
      access_token: this.jwtService.sign(payload),
      user: userResponse,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    try {
      const resetCode = await this.usersService.generatePasswordResetToken(forgotPasswordDto.email);
      await this.emailService.sendPasswordResetEmail(forgotPasswordDto.email, resetCode);
      
      return {
        message: 'Password reset code sent successfully. Please check your email.',
      };
    } catch (error) {
      // Don't reveal if email exists or not for security reasons
      return {
        message: 'If the email exists, a password reset code has been sent.',
      };
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    await this.usersService.resetPassword(resetPasswordDto.code, resetPasswordDto.newPassword);
    
    return {
      message: 'Password reset successfully. You can now login with your new password.',
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    await this.usersService.verifyEmail(verifyEmailDto.code);
    
    return {
      message: 'Email verified successfully. You can now login to your account.',
    };
  }

  async resendVerification(resendVerificationDto: ResendVerificationDto): Promise<{ message: string }> {
    try {
      const newCode = await this.usersService.generateNewVerificationToken(resendVerificationDto.email);
      await this.emailService.sendVerificationEmail(resendVerificationDto.email, newCode);
      
      return {
        message: 'Verification code sent successfully. Please check your email.',
      };
    } catch (error) {
      if (error.message === 'User not found') {
        throw new BadRequestException('User not found');
      }
      if (error.message === 'Email already verified') {
        throw new BadRequestException('Email is already verified');
      }
      throw error;
    }
  }
}
