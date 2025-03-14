import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from '../users/user.module'; // UserModule과의 순환참조 방지
import { RedisModule } from '../../global/redis/redis.module';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '15m' },
        }),
        RedisModule, // Redis 모듈 분리
        forwardRef(() => UserModule), // 순환참조 방지
        HttpModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService, JwtModule],
})
export class AuthModule {}
