import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    providers: [RabbitMQService],
    exports: [RabbitMQService],
})
export class RabbitMQModule {}
