import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BlogEntity } from '../entities/blog.entity';
import { GetBlogsQueryRequest } from '../dto/request/get.blog.query.request';
import { PaginationQueryDto } from '../../../global/pagination/pagination.query.dto';
import { Prisma } from '@prisma/client';
import { CrawlingBlogResponse } from '../dto/response/crawling.blog.response';

@Injectable()
export class BlogRepository {
    constructor(private readonly prisma: PrismaService) {}

    // async getAllUserBlogUrl(): Promise<{ id: number; blogUrl: string }[]> {
    //     return this.prisma.user.findMany({
    //         where: {
    //             isDeleted: false,
    //         },
    //         select: {
    //             id: true,
    //             blogUrl: true,
    //         },
    //     });
    // }

    // async getAllUserBlogUrl(): Promise<{ id: number; blogUrls: string[] }[]> {
    //     return this.prisma.user
    //         .findMany({
    //             where: {
    //                 isDeleted: false,
    //             },
    //             select: {
    //                 id: true,
    //                 tistoryUrl: true,
    //                 mediumUrl: true,
    //                 velogUrl: true,
    //             },
    //         })
    //         .then((users) =>
    //             users.map((user) => ({
    //                 id: user.id,
    //                 blogUrls: [
    //                     user.tistoryUrl,
    //                     user.mediumUrl,
    //                     user.velogUrl,
    //                 ].filter((url) => url !== null),
    //             })),
    //         );
    // }

    async createBlog(crawlingBlogDto: CrawlingBlogResponse): Promise<void> {
        const { userId, posts, category } = crawlingBlogDto;
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
                Logger.error(
                    `블로그 데이터 저장 실패: ${post.title}, Error: ${error.message}`,
                    error.stack,
                );
            }
        });
        await Promise.all(blogPromises);
    }

    async getBlogList(query: GetBlogsQueryRequest): Promise<BlogEntity[]> {
        const {
            keyword,
            category,
            offset = 0,
            limit = 10,
        }: GetBlogsQueryRequest = query;

        return this.prisma.blog.findMany({
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
                user: true,
            },
            skip: offset,
            take: limit,
            orderBy: {
                createdAt: Prisma.SortOrder.desc,
            },
        });
    }

    async getBlogsByUser(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<any> {
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
        return this.prisma.blog.findMany({
            where: {
                isDeleted: false,
                userId: userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        grade: true,
                        year: true,
                        school: true,
                        mainPosition: true,
                        subPosition: true,
                    },
                },
            },
            skip: offset,
            take: limit,
            orderBy: {
                createdAt: Prisma.SortOrder.desc,
            },
        });
    }

    async getBestBlogs(query: PaginationQueryDto): Promise<BlogEntity[]> {
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
        // 2주 계산
        const twoWeeksAgo: Date = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        // SQL 쿼리
        return this.prisma.$queryRaw<BlogEntity[]>(Prisma.sql`
            SELECT * FROM "Blog"
            WHERE "isDeleted" = false
                AND "date" >= ${twoWeeksAgo}
            ORDER BY ("viewCount" + "likeCount" * 10) DESC
            LIMIT ${limit} OFFSET ${offset}
        `);
    }
}
