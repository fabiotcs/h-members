import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule, AppConfigService } from '../../config';
import { UsersModule } from '../users';
import { SessionsModule } from '../sessions';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetController } from './password-reset.controller';
import { EmailModule } from '../email';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    SessionsModule,
    PassportModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      useFactory: (appConfig: AppConfigService) => ({
        secret: appConfig.auth.jwtSecret,
        signOptions: {
          expiresIn: appConfig.auth.jwtExpiresIn,
        },
      }),
      inject: [AppConfigService],
    }),
  ],
  controllers: [AuthController, PasswordResetController],
  providers: [AuthService, PasswordResetService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
