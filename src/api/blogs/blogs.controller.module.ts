import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogServiceModule } from '../../core/blogs/blog.service.module';

@Module({
    imports: [BlogServiceModule],
    controllers: [BlogController],
})
export class BlogControllerModule {}
