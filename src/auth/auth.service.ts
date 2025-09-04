import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto, ResendVerificationDto } from './dto/auth.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private auditService: AuditService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const user = await this.usersService.create(registerDto);
      const emailCode = user.emailVerificationCode!; // Non-null assertion since we just created it

      // Send verification email
      await this.emailService.sendVerificationEmail(user.email, emailCode);

      // Log successful registration
      await this.auditService.logUserAction(
        user.id,
        'REGISTER',
        'user',
        { email: user.email }
      );

      return {
        message: 'Registration successful. Please check your email for verification code.',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
        },
      };
    } catch (error) {
      // Log failed registration
      await this.auditService.log({
        action: 'REGISTER',
        resource: 'user',
        metadata: { email: registerDto.email },
        status: 'FAILED',
        errorMessage: error.message,
      });
      throw error;
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    // Check if account is locked
    const isLocked = await this.usersService.isAccountLocked(user.id);
    if (isLocked) {
      throw new UnauthorizedException('Account is temporarily locked due to too many failed login attempts');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await this.usersService.validatePassword(password, user.password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.usersService.incrementFailedLoginAttempts(user.id);
      
      // Log failed login attempt
      await this.auditService.logUserAction(
        user.id,
        'LOGIN',
        'auth',
        { email: user.email, reason: 'invalid_password' },
        'FAILED'
      );
      
      return null;
    }

    // Reset failed login attempts on successful password validation
    await this.usersService.resetFailedLoginAttempts(user.id);

    return user;
  }

  async login(user: User) {
    try {
      const payload = { sub: user.id, email: user.email };
      
      // Generate access token (15 minutes)
      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
      
      // Generate refresh token (7 days)
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
      
      // Store refresh token in database
      await this.usersService.updateRefreshToken(user.id, refreshToken);

      // Log successful login
      await this.auditService.logUserAction(
        user.id,
        'LOGIN',
        'auth',
        { email: user.email }
      );

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 900, // 15 minutes in seconds
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
        },
      };
    } catch (error) {
      // Log failed login
      await this.auditService.logUserAction(
        user.id,
        'LOGIN',
        'auth',
        { email: user.email },
        'FAILED'
      );
      throw error;
    }
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

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const user = await this.usersService.findByRefreshToken(refreshToken);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Generate new access token
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    return {
      access_token: accessToken,
      expires_in: 900, // 15 minutes in seconds
    };
  }

  async logout(userId: number) {
    await this.usersService.clearRefreshToken(userId);
  }
}
