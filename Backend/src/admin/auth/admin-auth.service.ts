import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) { }

  async login(dto: AdminLoginDto) {
    // Hardcoded Master Admin Login (Bypass DB)
    // Default admin credentials: testingadmin@gmail.com / abc123
    const masterEmail = process.env.ADMIN_EMAIL || 'testingadmin@gmail.com';
    const masterPassword = process.env.ADMIN_PASSWORD || 'abc123';

    if (dto.email === masterEmail && dto.password === masterPassword) {
      const payload = {
        sub: '00000000-0000-0000-0000-000000000000', // Special Master ID
        email: masterEmail,
        role: 'SUPER_ADMIN', // Hardcoded role
        name: 'Master Admin',
      };

      const accessToken = await this.jwt.signAsync(payload, {
        expiresIn: '8h',
        secret: this.config.get('JWT_SECRET'),
      });

      const refreshToken = await this.jwt.signAsync(payload, {
        expiresIn: '7d',
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      return {
        success: true,
        token: accessToken,
        accessToken,
        refreshToken,
        admin: {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role,
        },
      };
    }

    // Find admin by email
    const admin = await this.prisma.admin.findUnique({
      where: { email: dto.email },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if admin is active
    if (!admin.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(dto.password, admin.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT tokens
    const payload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.name,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: '8h',
      secret: this.config.get('JWT_SECRET'),
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
      secret: this.config.get('JWT_REFRESH_SECRET'),
    });

    return {
      success: true,
      token: accessToken,  // Also return as 'token' for compatibility
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }
}
