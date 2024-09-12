import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BlogEntity } from '../domain/blog.entity';
import { BlogDomain } from '../domain/blog.domain';
import { CreateBlogService } from '../interfaces/services/create.blog.service.interface';

@Injectable()
export class CreateBlogServiceImpl implements CreateBlogService {
    constructor(private readonly prisma: PrismaService) {}

    async createBlog(blogData: BlogDomain): Promise<BlogEntity> {
        return this.prisma.blog.create({
            data: { ...blogData },
            include: { user: true },
        });
    }
}
