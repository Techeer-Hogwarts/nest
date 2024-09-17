import { Injectable } from '@nestjs/common';
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
}
