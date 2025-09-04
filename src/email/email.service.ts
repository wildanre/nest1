import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure your email transporter here
    // For development, you can use a service like Gmail or Outlook
    // For production, use a proper email service like SendGrid, AWS SES, etc.
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@yourapp.com',
      to: email,
      subject: 'Email Verification Code',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333; text-align: center;">Email Verification</h2>
          <p>Thank you for registering with our application. Please use the verification code below to verify your email address:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f8f9fa; border: 2px dashed #007bff; border-radius: 10px; padding: 20px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">
                ${code}
              </span>
            </div>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 16px;">
            Enter this code in the verification form to complete your registration.
          </p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
            This code will expire in 24 hours. If you didn't request this verification, please ignore this email.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification code sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification code to ${email}:`, error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email: string, code: string): Promise<void> {
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@yourapp.com',
      to: email,
      subject: 'Password Reset Code',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333; text-align: center;">Password Reset</h2>
          <p>You have requested to reset your password. Please use the code below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f8f9fa; border: 2px dashed #dc3545; border-radius: 10px; padding: 20px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; color: #dc3545; letter-spacing: 5px;">
                ${code}
              </span>
            </div>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 16px;">
            Enter this code in the password reset form to create a new password.
          </p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
            This code will expire in 1 hour. If you didn't request this reset, please ignore this email.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset code sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset code to ${email}:`, error);
      throw new Error('Failed to send password reset email');
    }
  }
}
