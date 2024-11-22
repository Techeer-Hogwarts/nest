import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBlogRequest } from '../dto/request/create.blog.request';
import { BlogEntity } from '../entities/blog.entity';
import { GetBlogsQueryRequest } from '../dto/request/get.blog.query.request';
import { PaginationQueryDto } from '../../../global/common/pagination.query.dto';
import { UpdateBlogRequest } from '../dto/request/update.blog.request';
import { Prisma } from '@prisma/client';

@Injectable()
export class BlogRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createBlog(createBlogDomain: CreateBlogRequest): Promise<BlogEntity> {
        return this.prisma.blog.create({
            data: { ...createBlogDomain },
            include: { user: true },
        });
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
            throw new NotFoundException('게시물을 찾을 수 없습니다.');
        }
        return blog;
    }

    async getBlogList(query: GetBlogsQueryRequest): Promise<BlogEntity[]> {
        const {
            keyword,
            category,
            position,
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
                            category: {
                                contains: keyword,
                                mode: 'insensitive',
                            },
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
                ...(position && {
                    user: { mainPosition: position },
                }),
            },
            include: {
                user: true,
            },
            skip: offset,
            take: limit,
        });
    }

    async getBlogsByUser(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<BlogEntity[]> {
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
        return this.prisma.blog.findMany({
            where: {
                isDeleted: false,
                userId: userId,
            },
            include: {
                user: true,
            },
            skip: offset,
            take: limit,
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
                throw new NotFoundException('게시물을 찾을 수 없습니다.');
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
                throw new NotFoundException('게시물을 찾을 수 없습니다.');
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
