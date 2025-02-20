import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BlogEntity } from '../entities/blog.entity';
import { GetBlogsQueryRequest } from '../dto/request/get.blog.query.request';
import { PaginationQueryDto } from '../../../global/pagination/pagination.query.dto';
import { Prisma } from '@prisma/client';
import { CrawlingBlogResponse } from '../dto/response/crawling.blog.response';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';
import { GetBlogResponse } from '../dto/response/get.blog.response';
import { NotFoundBlogException } from '../../../global/exception/custom.exception';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { IndexBlogRequest } from '../dto/request/index.blog.request';
import { IndexService } from '../../../global/index/index.service';

@Injectable()
export class BlogRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: CustomWinstonLogger,
        private readonly indexService: IndexService,
    ) {}

    async getAllUserBlogUrl(): Promise<{ id: number; blogUrls: string[] }[]> {
        this.logger.debug(
            `모든 유저의 블로그 url 조회 처리 중`,
            BlogRepository.name,
        );
        const result = await this.prisma.user
            .findMany({
                where: {
                    isDeleted: false,
                },
                select: {
                    id: true,
                    tistoryUrl: true,
                    mediumUrl: true,
                    velogUrl: true,
                },
            })
            .then((users) =>
                users.map((user) => ({
                    id: user.id,
                    blogUrls: [
                        user.tistoryUrl,
                        user.mediumUrl,
                        user.velogUrl,
                    ].filter((url) => url !== null && url.trim() !== ''),
                })),
            );
        this.logger.debug(
            `모든 유저의 블로그 url 조회 성공`,
            BlogRepository.name,
        );
        return result;
    }

    async createBlog(crawlingBlogDto: CrawlingBlogResponse): Promise<void> {
        const { userId, posts, category } = crawlingBlogDto;
        this.logger.debug(
            `블로그 데이터 저장 시작: ${JSON.stringify(crawlingBlogDto)}`,
            BlogRepository.name,
        );
        const blogPromises = posts.map(async (post) => {
            try {
                const blog: BlogEntity = await this.prisma.blog.create({
                    data: {
                        userId,
                        ...post,
                        date: new Date(post.date),
                        category,
                    },
                    include: {
                        user: true,
                    },
                });
                const indexBlog = new IndexBlogRequest(blog);
                this.logger.debug(
                    `블로그 데이터 저장 후 인덱스 업데이트 요청 - ${JSON.stringify(indexBlog)}`,
                    BlogRepository.name,
                );
                await this.indexService.createIndex<IndexBlogRequest>(
                    'blog',
                    indexBlog,
                );
            } catch (error) {
                this.logger.error(
                    `블로그 데이터 저장 실패: ${post.title}, Error: ${error.message} error stack: ${error.stack}`,
                    BlogRepository.name,
                );
            }
        });
        await Promise.all(blogPromises);
    }

    async getBlogList(query: GetBlogsQueryRequest): Promise<GetBlogResponse[]> {
        const {
            category,
            offset = 0,
            limit = 10,
        }: GetBlogsQueryRequest = query;
        this.logger.debug(
            `query - category: ${category}, offset: ${offset}, limit: ${limit}`,
            BlogRepository.name,
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
                createdAt: Prisma.SortOrder.desc,
            },
        });
        this.logger.debug(
            `${blogs.length}개의 블로그 엔티티 목록 조회 성공`,
            BlogRepository.name,
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
            BlogRepository.name,
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
            BlogRepository.name,
        );
        return blogs.map((blog) => new GetBlogResponse(blog));
    }

    async getBestBlogs(query: PaginationQueryDto): Promise<GetBlogResponse[]> {
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
        // 2주 계산
        const twoWeeksAgo: Date = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        this.logger.debug(`2주 전 날짜: ${twoWeeksAgo}`, BlogRepository.name);
        // SQL 쿼리
        const blogs = await this.prisma.$queryRaw<BlogEntity[]>(Prisma.sql`
            SELECT * FROM "Blog"
            WHERE "isDeleted" = false
                AND "date" >= ${twoWeeksAgo}
            ORDER BY ("viewCount" + "likeCount" * 10) DESC
            LIMIT ${limit} OFFSET ${offset}
        `);
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
            BlogRepository.name,
        );
        return blogsWithUser.map((blog) => new GetBlogResponse(blog));
    }

    async increaseBlogViewCount(blogId: number): Promise<void> {
        this.logger.debug(
            `블로그 조회수 증가 처리 중 - blogId: ${blogId}`,
            BlogRepository.name,
        );
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
                BlogRepository.name,
            );
        } catch (error) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                this.logger.warn(
                    `블로그 조회수 증가 실패 - 존재하지 않는 blogId: ${blogId}`,
                    BlogRepository.name,
                );
                throw new NotFoundBlogException();
            }
            this.logger.error(
                `블로그 조회수 증가 중 예기치 않은 오류 발생 - blogId: ${blogId}, error: ${error.message}`,
                BlogRepository.name,
            );
            throw error;
        }
    }
    async getBlog(blogId: number): Promise<GetBlogResponse> {
        this.logger.debug(`블로그 ID ${blogId} 조회 요청`, BlogRepository.name);
        const blog = await this.prisma.blog.findUnique({
            where: {
                id: blogId,
                isDeleted: false, // 삭제된 블로그 제외
            },
            include: {
                user: true,
            },
        });
        this.logger.debug(`블로그 ID ${blogId} 조회 성공`, BlogRepository.name);
        return new GetBlogResponse(blog);
    }
}
