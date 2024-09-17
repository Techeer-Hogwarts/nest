import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateBlogDomain } from '../domain/create.blog.domain';
import { CreateBlogApplication } from '../interfaces/applications/create.blog.application.interface';
import { TYPES } from '../interfaces/types';

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
    async createBlog(@Body() blogDomain: CreateBlogDomain): Promise<any> {
        const blog = await this.createBlogApplication.createBlog(blogDomain);
        return {
            code: 200,
            message: '게시물을 생성했습니다.',
            data: blog,
        };
    }
}
