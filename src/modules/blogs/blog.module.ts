import { Module } from '@nestjs/common';
import { BlogController } from './controller/blog.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TYPES } from './interfaces/types';
import { CreateBlogServiceImpl } from './services/create.blog.service';

const createBlogApp = {
    provide: TYPES.applications.CreateBlogApplication,
    useClass: CreateBlogServiceImpl,
};

const createBlogService = {
    provide: TYPES.services.CreateBlogService,
    useClass: CreateBlogServiceImpl,
};

@Module({
    imports: [PrismaModule],
    controllers: [BlogController],
    providers: [createBlogApp, createBlogService],
})
export class BlogModule {}
