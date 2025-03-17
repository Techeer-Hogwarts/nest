import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogServiceModule } from '../../core/blogs/blog.service.module';
import { UserServiceModule } from '../../core/users/user.service.module';

@Module({
    imports: [BlogServiceModule, UserServiceModule],
    controllers: [BlogController],
})
export class BlogControllerModule {}
