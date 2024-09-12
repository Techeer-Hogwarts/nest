import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BlogDomain } from '../domain/blog.domain';
import { CreateBlogApplication } from '../interfaces/applications/create.blog.application.interface';
import { TYPES } from '../interfaces/types';
import { BlogEntity } from '../domain/blog.entity';

@ApiTags('blogs')
@Controller('/blog')
export class BlogController {
    constructor(
        @Inject(TYPES.applications.CreateBlogApplication)
        private readonly createBlogApplication: CreateBlogApplication,
    ) {}

    @Post('/create')
    @ApiOperation({
        summary: '블로그 게시물 생성',
        description: '새로운 블로그 게시물을 생성합니다.',
    })
    async createBlog(@Body() blogDomain: BlogDomain): Promise<BlogEntity> {
        return this.createBlogApplication.createBlog(blogDomain);
    }
}
