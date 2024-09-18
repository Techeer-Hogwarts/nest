import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { CreateBlogDomain } from './dto/request/create.blog.domain';
import { BlogEntity } from './entities/blog.entity';
import { GetBlogsQueryDto } from './dto/request/get.blog.query.dto';
import { GetBlogDomain } from './dto/response/get.blog.domain';

@ApiTags('blogs')
@Controller('/blog')
export class BlogController {
    constructor(private readonly blogService: BlogService) {}

    @Post('/create')
    @ApiOperation({
        summary: '블로그 게시물 생성',
        description: '새로운 블로그 게시물을 생성합니다.',
    })
    async createBlog(@Body() createBlogDomain: CreateBlogDomain): Promise<any> {
        const blog: BlogEntity =
            await this.blogService.createBlog(createBlogDomain);
        return {
            code: 201,
            message: '게시물을 생성했습니다.',
            data: blog,
        };
    }

    @Get(':blogId')
    async getBlog(@Param('blogId') blogId: string): Promise<any> {
        const blog: GetBlogDomain = await this.blogService.getBlog(
            parseInt(blogId, 10),
        );
        return {
            code: 200,
            message: '게시물을 조회했습니다.',
            data: blog,
        };
    }

    @Get()
    async getBlogs(@Query() query: GetBlogsQueryDto): Promise<any> {
        const blogs: GetBlogDomain[] = await this.blogService.getBlogs(query);
        return {
            code: 200,
            message: '블로그 게시물을 조회했습니다.',
            data: blogs,
        };
    }
}
