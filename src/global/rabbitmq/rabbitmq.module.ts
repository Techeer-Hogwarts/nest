import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { BlogModule } from '../../modules/blogs/blog.module';

@Module({
    imports: [BlogModule],
    providers: [RabbitMQService],
    exports: [RabbitMQService],
})
export class RabbitMQModule {}
