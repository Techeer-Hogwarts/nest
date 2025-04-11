import { Module, forwardRef } from '@nestjs/common';
import { TaskService } from './task.service';
import { RedisModule } from '../../infra/redis/redis.module';
import { RabbitMQModule } from '../../infra/rabbitmq/rabbitmq.module';
import { BlogServiceModule } from '../blogs/blog.service.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [
        RedisModule,
        RabbitMQModule,
        forwardRef(() => BlogServiceModule),
        ScheduleModule.forRoot(),
    ],
    providers: [TaskService],
    exports: [TaskService],
})
export class TaskServiceModule {}
