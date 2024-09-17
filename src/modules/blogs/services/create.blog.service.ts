import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BlogEntity } from '../domain/blog.entity';
import { CreateBlogDomain } from '../domain/create.blog.domain';
import { CreateBlogService } from '../interfaces/services/create.blog.service.interface';

@Injectable()
export class CreateBlogServiceImpl implements CreateBlogService {
    constructor(private readonly prisma: PrismaService) {}

    async createBlog(blogData: CreateBlogDomain): Promise<BlogEntity> {
        return this.prisma.blog.create({
            data: { ...blogData },
            include: { user: true },
        });
    }
}
