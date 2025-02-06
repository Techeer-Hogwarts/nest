import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BlogEntity } from '../entities/blog.entity';
import { GetBlogsQueryRequest } from '../dto/request/get.blog.query.request';
import { PaginationQueryDto } from '../../../global/pagination/pagination.query.dto';
import { Prisma } from '@prisma/client';
import { CrawlingBlogResponse } from '../dto/response/crawling.blog.response';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';
import { GetBlogResponse } from '../dto/response/get.blog.response';

@Injectable()
export class BlogRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: CustomWinstonLogger,
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
                await this.prisma.blog.create({
                    data: {
                        userId,
                        ...post,
                        date: new Date(post.date),
                        category,
                    },
                });
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
            keyword,
            category,
            offset = 0,
            limit = 10,
        }: GetBlogsQueryRequest = query;
        this.logger.debug(
            `query - keyword: ${keyword}, category: ${category}, offset: ${offset}, limit: ${limit}`,
            BlogRepository.name,
        );
        const blogs = await this.prisma.blog.findMany({
            where: {
                isDeleted: false,
                ...(keyword && {
                    OR: [
                        {
                            title: {
                                contains: keyword,
                                mode: 'insensitive',
                            },
                        },
                        {
                            category: category,
                        },
                        {
                            user: {
                                name: {
                                    contains: keyword,
                                    mode: 'insensitive',
                                },
                            },
                        },
                    ],
                }),
                ...(category && { category }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        nickname: true,
                        roleId: true,
                        profileImage: true,
                    },
                },
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
                user: {
                    select: {
                        id: true,
                        name: true,
                        nickname: true,
                        roleId: true,
                        profileImage: true,
                    },
                },
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
                    select: {
                        id: true,
                        name: true,
                        nickname: true,
                        roleId: true,
                        profileImage: true,
                    },
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
}
