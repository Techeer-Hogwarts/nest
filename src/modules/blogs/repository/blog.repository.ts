import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BlogEntity } from '../entities/blog.entity';
import { GetBlogsQueryRequest } from '../dto/request/get.blog.query.request';
import { PaginationQueryDto } from '../../../global/common/pagination.query.dto';
import { UpdateBlogRequest } from '../dto/request/update.blog.request';
import { BlogCategory, Prisma } from '@prisma/client';
import { CrawlingBlogResponse } from '../dto/response/crawling.blog.response';
import { NotFoundBlogException } from '../../../global/exception/custom.exception';

@Injectable()
export class BlogRepository {
    constructor(private readonly prisma: PrismaService) {}

    async getAllUserBlogUrl(): Promise<{ id: number; blogUrl: string }[]> {
        return this.prisma.user.findMany({
            where: {
                isDeleted: false,
            },
            select: {
                id: true,
                blogUrl: true,
            },
        });
    }

    async createBlog(crawlingBlogDto: CrawlingBlogResponse): Promise<void> {
        const { userId, posts } = crawlingBlogDto;
        const blogPromises = posts.map(async (post) => {
            try {
                await this.prisma.blog.create({
                    data: {
                        userId,
                        ...post,
                        date: new Date(post.date),
                        category: post.category.toUpperCase() as BlogCategory,
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

    async getBlog(blogId: number): Promise<BlogEntity> {
        const blog: BlogEntity = await this.prisma.blog.findUnique({
            where: {
                id: blogId,
                isDeleted: false,
            },
            include: {
                user: true,
            },
        });

        if (!blog) {
            throw new NotFoundBlogException();
        }
        return blog;
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
                        class: true,
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

    async deleteBlog(blogId: number): Promise<void> {
        try {
            await this.prisma.blog.update({
                where: {
                    id: blogId,
                    isDeleted: false,
                },
                data: { isDeleted: true },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundBlogException();
            }
            throw error;
        }
    }

    async updateBlog(
        blogId: number,
        updateBlogRequest: UpdateBlogRequest,
    ): Promise<BlogEntity> {
        const { title, url, date }: UpdateBlogRequest = updateBlogRequest;

        try {
            return await this.prisma.blog.update({
                where: {
                    id: blogId,
                    isDeleted: false,
                },
                data: {
                    title,
                    url,
                    date,
                },
                include: {
                    user: true,
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundBlogException();
            }
            throw error;
        }
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
