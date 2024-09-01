import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports: [RabbitMQModule, RedisModule],
    providers: [TaskService],
    exports: [TaskService],
})
export class TaskModule {}
