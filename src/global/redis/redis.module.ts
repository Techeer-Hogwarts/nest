import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global() // 전역 모듈로 설정하여 애플리케이션 어디서나 사용 가능
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: (configService: ConfigService): Redis => {
                const redisUrl = configService.get<string>('REDIS_URL');
                if (!redisUrl) {
                    throw new Error(
                        'REDIS_URL is not defined in environment variables',
                    );
                }
                return new Redis(redisUrl);
            },
            inject: [ConfigService],
        },
    ],
    exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
