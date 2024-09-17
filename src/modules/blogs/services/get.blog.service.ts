import { Injectable, NotFoundException } from '@nestjs/common';
import { GetBlogService } from '../interfaces/services/get.blog.service.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { BlogEntity } from '../domain/blog.entity';

@Injectable()
export class GetBlogServiceImpl implements GetBlogService {
    constructor(private readonly prisma: PrismaService) {}

    async getBlog(blogId: number): Promise<BlogEntity> {
        const blog = await this.prisma.blog.findUnique({
            where: {
                id: blogId,
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
