import { Module, forwardRef } from '@nestjs/common';
import { TaskService } from './task.service';
import { RedisModule } from '../../infra/redis/redis.module';
import { RabbitMQModule } from '../../infra/rabbitmq/rabbitmq.module';
import { BlogServiceModule } from '../blogs/blog.service.module';

@Module({
    imports: [RedisModule, RabbitMQModule, forwardRef(() => BlogServiceModule)],
    providers: [TaskService],
    exports: [TaskService],
})
export class TaskServiceModule {}
