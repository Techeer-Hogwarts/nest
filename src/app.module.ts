import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskModule } from './task/task.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { RedisModule } from './redis/redis.module';

@Module({
    imports: [TaskModule, RabbitMQModule, RedisModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
