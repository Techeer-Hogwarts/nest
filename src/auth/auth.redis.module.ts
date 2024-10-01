import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../modules/prisma/prisma.service';

@Global() // 전역 모듈로 설정하여 애플리케이션 어디서나 사용 가능
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: (): Redis => {
                return new Redis({
                    host: process.env.REDIS_HOST,
                    port: Number(process.env.REDIS_PORT),
                    password: process.env.REDIS_PASSWORD,
                });
            },
        },
        AuthService,
        PrismaService,
    ],
    exports: ['REDIS_CLIENT'],
    controllers: [AuthController],
})
export class RedisModule {}
