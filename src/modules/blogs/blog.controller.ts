import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogRequest } from './dto/request/create.blog.request';
import { GetBlogResponse } from './dto/response/get.blog.response';
import { PaginationQueryDto } from '../../global/common/pagination.query.dto';
import { GetBlogsQueryRequest } from './dto/request/get.blog.query.request';
import { UpdateBlogRequest } from './dto/request/update.blog.request';

@ApiTags('blogs')
@Controller('/blogs')
export class BlogController {
    constructor(private readonly blogService: BlogService) {}

    @Post('')
    @ApiOperation({
        summary: '블로그 게시물 생성',
        description: '새로운 블로그 게시물을 생성합니다.',
    })
    async createBlog(
        @Body() createBlogRequest: CreateBlogRequest,
    ): Promise<any> {
        const blog: GetBlogResponse =
            await this.blogService.createBlog(createBlogRequest);
        return {
            code: 201,
            message: '게시물을 생성했습니다.',
            data: blog,
        };
    }

    @Get('/best')
    @ApiOperation({
        summary: '블로그 게시물의 인기글 목록 조회',
        description: '(조회수 + 좋아요수*10)을 기준으로 인기글을 조회합니다.',
    })
    async getBestBlogs(@Query() query: PaginationQueryDto): Promise<any> {
        const blogs: GetBlogResponse[] =
            await this.blogService.getBestBlogs(query);
        return {
            code: 200,
            message: '인기 게시물을 조회했습니다.',
            data: blogs,
        };
    }

    @Get(':blogId')
    @ApiOperation({
        summary: '단일 블로그 게시물 조회',
        description: '지정된 ID의 블로그 게시물을 조회합니다.',
    })
    async getBlog(@Param('blogId', ParseIntPipe) blogId: number): Promise<any> {
        const blog: GetBlogResponse = await this.blogService.getBlog(blogId);
        return {
            code: 200,
            message: '블로그 게시물을 조회했습니다.',
            data: blog,
        };
    }

    @Get()
    @ApiOperation({
        summary: '블로그 게시물 목록 조회 및 검색',
        description: '블로그 게시물을 조회하고 검색합니다.',
    })
    async getBlogList(@Query() query: GetBlogsQueryRequest): Promise<any> {
        const blogs: GetBlogResponse[] =
            await this.blogService.getBlogList(query);
        return {
            code: 200,
            message: '블로그 게시물 목록을 조회했습니다.',
            data: blogs,
        };
    }

    @Get('/user/:userId')
    @ApiOperation({
        summary: '유저 별 블로그 게시물 목록 조회',
        description: '지정된 유저의 블로그 게시물을 조회합니다.',
    })
    async getBlogsByUser(
        @Param('userId', ParseIntPipe) userId: number,
        @Query() query: PaginationQueryDto,
    ): Promise<any> {
        const blogs: GetBlogResponse[] = await this.blogService.getBlogsByUser(
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

    @Patch(':blogId')
    @ApiOperation({
        summary: '블로그 게시물 수정',
        description: '지정된 ID의 블로그 게시물 제목과 URL을 수정합니다.',
    })
    async updateBlog(
        @Param('blogId', ParseIntPipe) blogId: number,
        @Body() updateBlogRequest: UpdateBlogRequest,
    ): Promise<any> {
        const blog: GetBlogResponse = await this.blogService.updateBlog(
            blogId,
            updateBlogRequest,
        );
        return {
            code: 200,
            message: '게시물이 수정되었습니다.',
            data: blog,
        };
    }
}
