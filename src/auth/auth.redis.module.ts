import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../modules/prisma/prisma.module';

@Global()
@Module({
    imports: [ConfigModule, PrismaModule],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            inject: [ConfigService],
            useFactory: (configService: ConfigService): Redis => {
                const redisUrl = configService.get<string>('REDIS_URL');
                if (!redisUrl) {
                    throw new Error(
                        'REDIS_URL is not defined in environment variables',
                    );
                }

                console.log('Connecting to Redis with URL:', redisUrl);

                return new Redis(redisUrl);
            },
        },
    ],
    exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
