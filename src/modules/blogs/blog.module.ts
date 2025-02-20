import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogRepository } from './repository/blog.repository';
import { UserModule } from '../users/user.module';
import { AuthModule } from '../auth/auth.module';
import { RabbitMQModule } from '../../global/rabbitmq/rabbitmq.module';
import { IndexModule } from '../../global/index/index.module';

@Module({
    imports: [
        PrismaModule,
        UserModule,
        AuthModule,
        forwardRef(() => RabbitMQModule),
        IndexModule,
    ],
    controllers: [BlogController],
    providers: [BlogService, BlogRepository],
    exports: [BlogService, BlogRepository],
})
export class BlogModule {}
