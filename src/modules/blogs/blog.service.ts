import { Injectable } from '@nestjs/common';
import { BlogRepository } from './repository/blog.repository';
import { CreateBlogDomain } from './dto/request/create.blog.domain';
import { BlogEntity } from './entities/blog.entity';

@Injectable()
export class BlogService {
    constructor(private readonly blogRepository: BlogRepository) {}

    async createBlog(createBlogDomain: CreateBlogDomain): Promise<BlogEntity> {
        return this.blogRepository.createBlog(createBlogDomain);
    }
}
