import { Global, Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { RedisModule } from '../redis/redis.module';
import { BlogModule } from '../../modules/blogs/blog.module';
import { TaskController } from './task.controller';
import { ScheduleModule } from '@nestjs/schedule';

@Global()
@Module({
    imports: [
        RabbitMQModule,
        RedisModule,
        BlogModule,
        ScheduleModule.forRoot(),
    ],
    controllers: [TaskController],
    providers: [TaskService],
    exports: [TaskService],
})
export class TaskModule {}
