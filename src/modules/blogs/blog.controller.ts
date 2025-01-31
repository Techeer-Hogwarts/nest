import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { BlogService } from './blog.service';
import { GetBlogResponse } from './dto/response/get.blog.response';
import { PaginationQueryDto } from '../../global/patination/pagination.query.dto';
import { GetBlogsQueryRequest } from './dto/request/get.blog.query.request';

@ApiTags('blogs')
@Controller('/blogs')
export class BlogController {
    constructor(private readonly blogService: BlogService) {}

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
}
