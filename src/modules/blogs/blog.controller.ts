import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    Query,
    ParseIntPipe,
    Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { CreateBlogDomain } from './dto/request/create.blog.domain';
import { BlogEntity } from './entities/blog.entity';
import { GetBlogsQueryDto } from './dto/request/get.blog.query.dto';
import { GetBlogDomain } from './dto/response/get.blog.domain';
import { PaginationQueryDto } from './dto/request/pagination.query.dto';

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
    @ApiOperation({
        summary: '단일 블로그 게시물 조회',
        description: '지정된 ID의 블로그 게시물을 조회합니다.',
    })
    async getBlog(@Param('blogId', ParseIntPipe) blogId: number): Promise<any> {
        const blog: GetBlogDomain = await this.blogService.getBlog(blogId);
        return {
            code: 200,
            message: '게시물을 조회했습니다.',
            data: blog,
        };
    }

    @Get()
    @ApiOperation({
        summary: '블로그 게시물 목록 조회 및 검색',
        description: '블로그 게시물을 조회하고 검색합니다.',
    })
    async getBlogs(@Query() query: GetBlogsQueryDto): Promise<any> {
        const blogs: GetBlogDomain[] = await this.blogService.getBlogs(query);
        return {
            code: 200,
            message: '블로그 게시물을 조회했습니다.',
            data: blogs,
        };
    }

    @Get('/user/:userId')
    @ApiOperation({
        summary: '유저 별 블로그 게시물 목록 조회',
        description: '지정된 유저의 블로그 게시물을 조회합니다.',
    })
    async getBlogsByUserId(
        @Param('userId', ParseIntPipe) userId: number,
        @Query() query: PaginationQueryDto,
    ): Promise<any> {
        const blogs: GetBlogDomain[] = await this.blogService.getBlogsByUserId(
            userId,
            query,
        );
        return {
            code: 200,
            message: '블로그 게시물을 조회했습니다.',
            data: blogs,
        };
    }

    @Delete(':blogId')
    @ApiOperation({
        summary: '블로그 게시물 삭제',
        description: '지정된 ID의 블로그 게시물을 삭제합니다.',
    })
    async deleteBlog(
        @Param('blogId', ParseIntPipe) blogId: number,
    ): Promise<any> {
        await this.blogService.deleteBlog(blogId);
        return {
            code: 200,
            message: '게시물이 삭제되었습니다.',
        };
    }
}
