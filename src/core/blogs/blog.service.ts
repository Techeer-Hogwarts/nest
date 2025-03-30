import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { NotFoundBlogException } from '../../common/exception/custom.exception';

import { IndexService } from '../../infra/index/index.service';
import { TaskService } from '../task/task.service';

import { GetBlogResponse } from '../../common/dto/blogs/response/get.blog.response';
import { GetBlogsQueryRequest } from '../../common/dto/blogs/request/get.blog.query.request';
import { PaginationQueryDto } from '../../common/pagination/pagination.query.dto';

@Injectable()
export class BlogService {
    constructor(
        private readonly taskService: TaskService,
        private readonly logger: CustomWinstonLogger,
        private readonly indexService: IndexService,
        private readonly prisma: PrismaService,
    ) {}

    async createSharedBlog(userId: number, url: string): Promise<void> {
        this.logger.debug(
            `외부 블로그 게시 요청 중 - userId: ${userId}, url: ${url}`,
            BlogService.name,
        );
        await this.taskService.requestSharedPostFetch(userId, url);
    }

    async getBlogList(query: GetBlogsQueryRequest): Promise<GetBlogResponse[]> {
        const {
            category,
            offset = 0,
            limit = 10,
        }: GetBlogsQueryRequest = query;
        this.logger.debug(
            `query - category: ${category}, offset: ${offset}, limit: ${limit}`,
            BlogService.name,
        );
        const blogs = await this.prisma.blog.findMany({
            where: {
                isDeleted: false,
                ...(category && { category }),
            },
            include: {
                user: true,
            },
            skip: offset,
            take: limit,
            orderBy: {
                title: 'asc',
            },
        });
        this.logger.debug(
            `${blogs.length}개의 블로그 엔티티 목록 조회 성공`,
            BlogService.name,
        );
        return blogs.map((blog) => new GetBlogResponse(blog));
    }

    async getBlogsByUser(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<GetBlogResponse[]> {
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
        this.logger.debug(
            `query - offset: ${offset}, limit: ${limit}`,
            BlogService.name,
        );
        const blogs = await this.prisma.blog.findMany({
            where: {
                isDeleted: false,
                userId: userId,
            },
            include: {
                user: true,
            },
            skip: offset,
            take: limit,
            orderBy: {
                createdAt: Prisma.SortOrder.desc,
            },
        });
        this.logger.debug(
            `${blogs.length}개의 유저 별 블로그 엔티티 목록 조회 성공`,
            BlogService.name,
        );
        return blogs.map((blog) => new GetBlogResponse(blog));
    }

    async getBestBlogs(query: PaginationQueryDto): Promise<GetBlogResponse[]> {
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
        // 2주 계산
        const twoWeeksAgo: Date = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        this.logger.debug(`2주 전 날짜: ${twoWeeksAgo}`, BlogService.name);

        const blogs = await this.prisma.$kysely
            .selectFrom('Blog')
            .selectAll()
            .where('isDeleted', '=', false)
            .where('date', '>=', twoWeeksAgo)
            .orderBy(sql`"viewCount" + "likeCount" * 10`, 'desc')
            .limit(limit)
            .offset(offset)
            .execute();

        // User 정보 추가 조회
        const blogsWithUser = await Promise.all(
            blogs.map(async (blog) => {
                const user = await this.prisma.user.findUnique({
                    where: { id: blog.userId },
                });
                return {
                    ...blog,
                    user,
                }; // blog 객체에 user 추가
            }),
        );
        this.logger.debug(
            `${blogs.length}개의 인기글 블로그 엔티티 목록 조회 성공 - ${JSON.stringify(blogs)}`,
            BlogService.name,
        );
        return blogsWithUser.map((blog) => new GetBlogResponse(blog));
    }
    async getBlog(blogId: number): Promise<GetBlogResponse> {
        const blog = await this.prisma.blog.findUnique({
            where: {
                id: blogId,
                isDeleted: false, // 삭제된 블로그 제외
            },
            include: {
                user: true,
            },
        });
        this.logger.debug(`블로그 ID ${blogId} 조회 성공`, BlogService.name);
        return new GetBlogResponse(blog);
    }

    async increaseBlogViewCount(blogId: number): Promise<void> {
        try {
            const result = await this.prisma.blog.update({
                where: {
                    id: blogId,
                },
                data: {
                    viewCount: {
                        increment: 1,
                    },
                },
            });
            this.logger.debug(
                `블로그 조회수 증가 성공 - viewCount: ${result.viewCount}`,
                BlogService.name,
            );
        } catch (error) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                this.logger.warn(
                    `블로그 조회수 증가 실패 - 존재하지 않는 blogId: ${blogId}`,
                    BlogService.name,
                );
                throw new NotFoundBlogException();
            }
            this.logger.error(
                `블로그 조회수 증가 중 예기치 않은 오류 발생 - blogId: ${blogId}, error: ${error.message}`,
                BlogService.name,
            );
            throw error;
        }
        this.logger.debug(
            `블로그 조회수 증가 성공 - blogId: ${blogId}`,
            BlogService.name,
        );
    }

    async deleteBlog(blogId: number): Promise<GetBlogResponse> {
        const deletedBlog = await this.prisma.blog.update({
            where: {
                id: blogId,
                isDeleted: false, // 이미 삭제된 블로그는 제외
            },
            data: {
                isDeleted: true, // soft delete 처리
            },
            include: {
                user: true,
            },
        });
        // 인덱스 삭제
        this.logger.debug(
            `블로그 삭제 후 인덱스 삭제 요청 - blogId: ${blogId}`,
            BlogService.name,
        );
        await this.indexService.deleteIndex('blog', String(blogId));

        this.logger.debug(
            `블로그 삭제 성공 후 GetBlogResponse 로 변환 중`,
            BlogService.name,
        );
        return new GetBlogResponse(deletedBlog);
    }
}
