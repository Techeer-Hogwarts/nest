import { Module } from '@nestjs/common';
import { BlogController } from './controller/blog.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TYPES } from './interfaces/types';
import { CreateBlogServiceImpl } from './services/create.blog.service';
import { GetBlogServiceImpl } from './services/get.blog.service';
import { GetBlogApplicationImpl } from './applications/get.blog.application';

const createBlogApp = {
    provide: TYPES.applications.CreateBlogApplication,
    useClass: CreateBlogServiceImpl,
};

const getBlogApp = {
    provide: TYPES.applications.GetBlogApplication,
    useClass: GetBlogApplicationImpl,
};

const createBlogService = {
    provide: TYPES.services.CreateBlogService,
    useClass: CreateBlogServiceImpl,
};

const getBlogService = {
    provide: TYPES.services.GetBlogService,
    useClass: GetBlogServiceImpl,
};

@Module({
    imports: [PrismaModule],
    controllers: [BlogController],
    providers: [createBlogApp, getBlogApp, createBlogService, getBlogService],
})
export class BlogModule {}
