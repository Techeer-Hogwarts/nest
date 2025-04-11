import { Module } from '@nestjs/common';
import { AwsModule } from './awsS3/aws.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { RedisModule } from './redis/redis.module';
import { PrismaModule } from './prisma/prisma.module';
import { IndexModule } from './index/index.module';
import { GoogleDriveModule } from './googleDrive/google.drive.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        AwsModule,
        RabbitMQModule,
        RedisModule,
        PrismaModule,
        IndexModule,
        GoogleDriveModule,
        ConfigModule,
    ],
    exports: [
        AwsModule,
        RabbitMQModule,
        RedisModule,
        PrismaModule,
        IndexModule,
        GoogleDriveModule,
    ],
})
export class InfraModule {}
