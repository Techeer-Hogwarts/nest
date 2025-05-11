import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import Redis from 'ioredis';

import { RedisService } from './redis.service';

import { PrismaService } from '../prisma/prisma.service';

@Global() // 전역 모듈로 설정
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: (): Redis => {
                const redisUrl = process.env.REDIS_URL; // process.env로 변경
                if (!redisUrl) {
                    throw new Error(
                        'REDIS_URL is not defined in environment variables',
                    );
                }
                return new Redis(redisUrl);
            },
        },
        PrismaService,
        RedisService,
    ],
    exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
