import { Global, Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { RedisModule } from '../redis/redis.module';
import { BlogModule } from '../../modules/blogs/blog.module';
import { TaskController } from './task.controller';

@Global()
@Module({
    imports: [RabbitMQModule, RedisModule, BlogModule],
    controllers: [TaskController],
    providers: [TaskService],
    exports: [TaskService],
})
export class TaskModule {}
