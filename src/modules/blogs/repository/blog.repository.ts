import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBlogDomain } from '../dto/request/create.blog.domain';
import { BlogEntity } from '../entities/blog.entity';

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
            throw new NotFoundException('해당 게시물을 찾지 못했습니다.');
        }
        return blog;
    }
}
