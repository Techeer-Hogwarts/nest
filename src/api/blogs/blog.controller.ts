import {
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { PaginationQueryDto } from '../../common/pagination/pagination.query.dto';
import { GetBlogsQueryRequest } from '../../common/dto/blogs/request/get.blog.query.request';
import { GetBlogResponse } from '../../common/dto/blogs/response/get.blog.response';
import { CurrentUser } from '../../common/decorator/user.decorator';
import { RequestUser } from '../../common/dto/users/request/user.interface';

import { JwtAuthGuard } from '../../core/auth/jwt.guard';
import { BlogService } from '../../core/blogs/blog.service';

import {
    CreateSharedBlogDoc,
    DeleteBlogDoc,
    GetBestBlogsDoc,
    GetBlogDoc,
    GetBlogListDoc,
    GetBlogsByUserDoc,
    IncreaseBlogViewCountDoc,
} from './blog.docs';

@ApiTags('blogs')
@Controller('/blogs')
export class BlogController {
    constructor(
        private readonly blogService: BlogService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    @CreateSharedBlogDoc()
    async createSharedBlog(
        @CurrentUser() requestUser: RequestUser,
        @Query('url') url: string,
    ): Promise<void> {
        this.logger.debug(
            `외부 블로그 게시 요청 처리 중 - userId: ${requestUser.id}, url: ${url}`,
            BlogController.name,
        );
        await this.blogService.createSharedBlog(requestUser.id, url);
        this.logger.debug(
            `외부 블로그 게시 요청 처리 완료`,
            BlogController.name,
        );
    }

    @Put('/:blogId')
    @IncreaseBlogViewCountDoc()
    async increaseBlogViewCount(
        @Param('blogId') blogId: number,
    ): Promise<void> {
        this.logger.debug(`블로그 조회수 증가 처리 중`, BlogController.name);
        await this.blogService.increaseBlogViewCount(blogId);
        this.logger.debug(`블로그 조회수 증가 처리 완료`, BlogController.name);
    }

    @Get('/best')
    @GetBestBlogsDoc()
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
    @GetBlogListDoc()
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
    @GetBlogsByUserDoc()
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
    @GetBlogDoc()
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

    @Delete('/:blogId')
    @DeleteBlogDoc()
    async deleteBlog(
        @Param('blogId', ParseIntPipe) blogId: number,
    ): Promise<GetBlogResponse> {
        this.logger.debug(
            `블로그 게시물 삭제 처리 중 - blogId: ${blogId}`,
            BlogController.name,
        );
        const result = await this.blogService.deleteBlog(blogId);
        this.logger.debug(`블로그 게시물 삭제 처리 완료`, BlogController.name);

        return result;
    }
}
