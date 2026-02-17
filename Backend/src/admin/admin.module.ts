import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { QueueManagerController } from './queue-manager.controller';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminJwtStrategy } from './guards/admin-jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { ServicesModule } from '../services/services.module';
import { TokensModule } from '../tokens/tokens.module';
import { AbuseModule } from '../abuse/abuse.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),
    JwtModule.register({}),
    ServicesModule,
    TokensModule,
    AbuseModule,
    NotificationsModule,
  ],
  controllers: [AdminController, QueueManagerController, AdminAuthController],
  providers: [AdminService, AdminAuthService, AdminJwtStrategy, RolesGuard],
  exports: [AdminService],
})
export class AdminModule {}
