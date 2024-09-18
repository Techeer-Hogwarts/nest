import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBlogDomain } from '../dto/request/create.blog.domain';
import { BlogEntity } from '../entities/blog.entity';
import { GetBlogsQueryDto } from '../dto/request/get.blog.query.dto';
import { PaginationQueryDto } from '../dto/request/pagination.query.dto';
import { UpdateBlogDto } from '../dto/request/update.blog.dto';

@Injectable()
export class BlogRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createBlog(createBlogDomain: CreateBlogDomain): Promise<BlogEntity> {
        return this.prisma.blog.create({
            data: { ...createBlogDomain },
            include: { user: true },
        });
    }

    async getBlog(blogId: number): Promise<BlogEntity> {
        const blog = await this.prisma.blog.findUnique({
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

    async getBlogs(query: GetBlogsQueryDto): Promise<BlogEntity[]> {
        const { keyword, category, position, offset = 0, limit = 10 } = query;

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

    async getBlogsByUserId(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<BlogEntity[]> {
        const { offset = 0, limit = 10 } = query;
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
        await this.prisma.blog.update({
            where: { id: blogId },
            data: { isDeleted: true },
        });
    }

    async updateBlog(
        blogId: number,
        updateBlogDto: UpdateBlogDto,
    ): Promise<BlogEntity> {
        const { title, url, date } = updateBlogDto;

        return this.prisma.blog.update({
            where: {
                id: blogId,
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
    }
}
