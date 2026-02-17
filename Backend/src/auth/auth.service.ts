import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private mailTransporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {
    // Initialize SMTP email transporter
    const smtpHost = this.config.get('SMTP_HOST');
    const smtpUser = this.config.get('SMTP_USER');
    const smtpPass = this.config.get('SMTP_PASS');

    if (smtpHost && smtpUser && smtpPass) {
      this.mailTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(this.config.get('SMTP_PORT', '587')),
        secure: this.config.get('SMTP_PORT') === '465', // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }
  }

  // ==================== Email Verification ====================
  async sendEmailOtp(email: string): Promise<{ success: boolean; message: string }> {
    // Normalize email to lowercase and trim (CRITICAL: Must match verifyEmailOtp normalization)
    const normalizedEmail = email.trim().toLowerCase();
    this.logger.log(`[Auth] sendEmailOtp called for ${normalizedEmail}`);

    // Generate 6-digit OTP
    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTPs for this email (use normalized email)
    await this.prisma.oTPVerification.deleteMany({
      where: { email: normalizedEmail, type: 'EMAIL_VERIFICATION' },
    });

    // Create new OTP record (use normalized email)
    await this.prisma.oTPVerification.create({
      data: {
        email: normalizedEmail,
        code,
        type: 'EMAIL_VERIFICATION',
        expiresAt,
      },
    });

    // Check if email service is configured
    if (!this.mailTransporter) {
      throw new BadRequestException('Email service is not configured');
    }

    // Send email via SMTP (use original email for sending, but store normalized in DB)
    try {
      await this.mailTransporter.sendMail({
        from: `"${this.config.get('SMTP_FROM_NAME', 'Digital Queue System')}" <${this.config.get('SMTP_USER')}>`,
        to: email, // Use original email for sending
        subject: 'Your Queue System Verification Code',
        text: `Your verification code is: ${code}. This code will expire in 5 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3B82F6;">Digital Queue Management System</h2>
            <p>Your verification code is:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">
              ${code}
            </div>
            <p style="color: #6b7280; margin-top: 20px;">This code will expire in 5 minutes.</p>
            <p style="color: #6b7280;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
      });

      return {
        success: true,
        message: 'OTP sent to email successfully',
      };
    } catch (error) {
      throw new BadRequestException('Failed to send email. Please try again.');
    }
  }

  async verifyEmailOtp(email: string, code: string): Promise<{ success: boolean; message: string; tokens?: any }> {
    const normalizedEmail = email.trim().toLowerCase();
    this.logger.log(`[Auth] verifyEmailOtp called for ${normalizedEmail} code=${code}`);

    let otpRecord = null;
    try {
      otpRecord = await this.prisma.oTPVerification.findFirst({
        where: {
          email: normalizedEmail,
          type: 'EMAIL_VERIFICATION',
          isVerified: false,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      this.logger.error('[Auth] DB error during OTP lookup', err);
      throw new BadRequestException('Database error during OTP lookup');
    }

    if (!otpRecord) {
      this.logger.warn(`[Auth] No OTP found for email: ${normalizedEmail}`);
      throw new BadRequestException('No verification code found for this email. Please request a new code.');
    }

    // Check if already verified (race condition protection)
    if (otpRecord.isVerified) {
      this.logger.warn(`[Auth] OTP already verified for email: ${normalizedEmail}`);
      throw new BadRequestException('This verification code has already been used. Please request a new code.');
    }

    if (otpRecord.expiresAt < new Date()) {
      this.logger.warn(`[Auth] OTP expired for email: ${normalizedEmail}`);
      throw new BadRequestException('Verification code has expired. Please request a new code.');
    }

    if (otpRecord.attempts >= (otpRecord.maxAttempts ?? 5)) {
      this.logger.warn(`[Auth] OTP max attempts exceeded for email: ${normalizedEmail}`);
      throw new BadRequestException('Maximum attempts exceeded. Please request a new code.');
    }

    if (otpRecord.code !== code) {
      await this.prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      this.logger.warn(`[Auth] Invalid OTP code for email: ${normalizedEmail}`);
      throw new BadRequestException('Invalid verification code');
    }

    // Use transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      // Re-fetch OTP record within transaction to ensure lock/consistency if needed
      // But for now, we'll just use the ID we found, but we should verify it's still valid if we were strict.
      // However, since we already did checks, we'll proceed with the update using the ID.
      // Note: In high concurrency, re-fetching with 'for update' would be better, but Prisma doesn't support that easily yet.

      // Mark as verified
      await tx.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { isVerified: true, verifiedAt: new Date() },
      });

      // Create or update user with normalized email
      let user = null;
      try {
        user = await tx.user.upsert({
          where: { email: normalizedEmail },
          update: { emailVerified: true },
          create: {
            email: normalizedEmail,
            phone: null,
            emailVerified: true,
            phoneVerified: false,
          },
        });
        this.logger.log(`[Auth] upsert user id=${user.id} email=${normalizedEmail}`);
      } catch (err) {
        this.logger.error('[Auth] upsert user failed', err);
        if (err.code === 'P2002') {
          throw new BadRequestException('User already exists with this email or phone');
        }
        if (err.code === 'P2003') {
          throw new BadRequestException('Foreign key constraint failed during user creation');
        }
        throw new BadRequestException('Failed to create or update user');
      }

      // Generate tokens for the user
      let tokens = null;
      try {
        tokens = await this.generateTokens(user.id, user.email, user.phone || '');
      } catch (err) {
        this.logger.error('[Auth] token generation failed', err);
        throw new BadRequestException('Failed to generate tokens');
      }

      return { success: true, message: 'Email verified successfully', tokens };
    });
  }


  // ==================== Token Generation ====================
  async generateTokens(userId: string, email: string, phone: string) {
    const payload = {
      sub: userId,
      email,
      phone,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        expiresIn: this.config.get('JWT_EXPIRATION', '15m'),
        secret: this.config.get('JWT_SECRET'),
      }),
      this.jwt.signAsync(payload, {
        expiresIn: this.config.get('JWT_REFRESH_EXPIRATION', '7d'),
        secret: this.config.get('JWT_REFRESH_SECRET'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.isBlocked) {
        throw new UnauthorizedException('Invalid user');
      }

      return this.generateTokens(user.id, user.email, user.phone);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ==================== Helper Methods ====================
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
