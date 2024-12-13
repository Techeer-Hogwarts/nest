import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogRepository } from './repository/blog.repository';

@Module({
    imports: [PrismaModule],
    controllers: [BlogController],
    providers: [BlogService, BlogRepository],
    exports: [BlogRepository],
})
export class BlogModule {}
