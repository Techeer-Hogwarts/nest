import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { GetBlogResponse } from './dto/response/get.blog.response';
import { PaginationQueryDto } from '../../global/pagination/pagination.query.dto';
import { GetBlogsQueryRequest } from './dto/request/get.blog.query.request';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Request } from 'express';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';

@ApiTags('blogs')
@Controller('/blogs')
export class BlogController {
    constructor(
        private readonly blogService: BlogService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({
        summary: '외부 블로그 게시',
        description: '외부 블로그를 게시합니다.',
    })
    @ApiQuery({
        name: 'url',
        type: String,
        description: '게시할 외부 블로그의 URL',
        required: true,
    })
    async createSharedBlog(
        @Req() request: Request,
        @Query('url') url: string,
    ): Promise<void> {
        const user = request.user as any;
        this.logger.debug(
            `외부 블로그 게시 요청 처리 중 - userId: ${user.id}, url: ${url}`,
            BlogController.name,
        );
        await this.blogService.createSharedBlog(user.id, url);
        this.logger.debug(
            `외부 블로그 게시 요청 처리 완료`,
            BlogController.name,
        );
    }

    @Put('/:blogId')
    @ApiOperation({
        summary: '블로그 조회수 증가',
        description: '블로그 조회수 증가시킵니다.',
    })
    async increaseBlogViewCount(
        @Param('blogId') blogId: number,
    ): Promise<void> {
        this.logger.debug(`블로그 조회수 증가 처리 중`, BlogController.name);
        await this.blogService.increaseBlogViewCount(blogId);
        this.logger.debug(`블로그 조회수 증가 처리 완료`, BlogController.name);
    }

    @Get('/best')
    @ApiOperation({
        summary: '블로그 게시물의 인기글 목록 조회',
        description:
            '2주간의 글 중 (조회수 + 좋아요수*10)을 기준으로 인기글을 조회합니다.',
    })
    async getBestBlogs(
        @Query() query: PaginationQueryDto,
    ): Promise<GetBlogResponse[]> {
        this.logger.debug(
            `인기글 목록 조회 처리 중 - query: ${JSON.stringify(query)}`,
            BlogController.name,
        );
        const result = await this.blogService.getBestBlogs(query);
        this.logger.debug(`인기글 목록 조회 처리 완료`, BlogController.name);
        return result;
    }

    @Get()
    @ApiOperation({
        summary: '블로그 게시물 목록 조회 및 검색',
        description: '블로그 게시물을 조회하고 검색합니다.',
    })
    async getBlogList(
        @Query() query: GetBlogsQueryRequest,
    ): Promise<GetBlogResponse[]> {
        this.logger.debug(
            `블로그 목록 조회 및 검색 처리 중 - query: ${JSON.stringify(query)}`,
            BlogController.name,
        );
        const result = await this.blogService.getBlogList(query);
        this.logger.debug(
            `블로그 목록 조회 및 검색 처리 완료`,
            BlogController.name,
        );
        return result;
    }

    @Get('/user/:userId')
    @ApiOperation({
        summary: '유저 별 블로그 게시물 목록 조회',
        description: '지정된 유저의 블로그 게시물을 조회합니다.',
    })
    async getBlogsByUser(
        @Param('userId', ParseIntPipe) userId: number,
        @Query() query: PaginationQueryDto,
    ): Promise<GetBlogResponse[]> {
        this.logger.debug(
            `유저 별 블로그 게시물 목록 조회 처리 중 - userId: ${userId}, query: ${JSON.stringify(query)}`,
            BlogController.name,
        );
        const result = await this.blogService.getBlogsByUser(userId, query);
        this.logger.debug(
            `유저 별 블로그 게시물 목록 조회 처리 완료`,
            BlogController.name,
        );
        return result;
    }
    @Get('/:blogId')
    @ApiOperation({
        summary: '블로그 단일 조회',
        description: '블로그 ID를 기반으로 단일 블로그 게시물을 조회합니다.',
    })
    async getBlog(
        @Param('blogId', ParseIntPipe) blogId: number,
    ): Promise<GetBlogResponse> {
        this.logger.debug(
            `단일 블로그 게시물 조회 처리 중 - blogId: ${blogId}`,
            BlogController.name,
        );
        const result = await this.blogService.getBlog(blogId);
        this.logger.debug(
            `단일 블로그 게시물 조회 처리 완료`,
            BlogController.name,
        );

        return result;
    }
}
