import { Controller, Post, Body, Inject, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateBlogDomain } from '../domain/request/create.blog.domain';
import { CreateBlogApplication } from '../interfaces/applications/create.blog.application.interface';
import { TYPES } from '../interfaces/types';
import { GetBlogApplication } from '../interfaces/applications/get.blog.application.interface';
import { BlogEntity } from '../domain/blog.entity';

@ApiTags('blogs')
@Controller('/blog')
export class BlogController {
    constructor(
        @Inject(TYPES.applications.CreateBlogApplication)
        private readonly createBlogApplication: CreateBlogApplication,
        @Inject(TYPES.applications.GetBlogApplication)
        private readonly getBlogApplication: GetBlogApplication,
    ) {}

    @Post('/create')
    @ApiOperation({
        summary: '블로그 게시물 생성',
        description: '새로운 블로그 게시물을 생성합니다.',
    })
    async createBlog(@Body() blogData: CreateBlogDomain): Promise<any> {
        const blog: BlogEntity =
            await this.createBlogApplication.createBlog(blogData);
        return {
            code: 201,
            message: '게시물을 생성했습니다.',
            data: blog,
        };
    }

    @Get(':blogId')
    async getBlog(@Param('blogId') blogId: string): Promise<any> {
        const blog = await this.getBlogApplication.getBlog(
            parseInt(blogId, 10),
        );
        return {
            code: 200,
            message: '게시물을 조회했습니다.',
            data: blog,
        };
    }
}
