import { Injectable } from '@nestjs/common';
import { BlogRepository } from './repository/blog.repository';
import { CreateBlogDomain } from './dto/request/create.blog.domain';
import { BlogEntity } from './entities/blog.entity';
import { GetBlogDomain } from './dto/response/get.blog.domain';
import { GetBlogsQueryDto } from './dto/request/get.blog.query.dto';

@Injectable()
export class BlogService {
    constructor(private readonly blogRepository: BlogRepository) {}

    async createBlog(createBlogDomain: CreateBlogDomain): Promise<BlogEntity> {
        return this.blogRepository.createBlog(createBlogDomain);
    }

    async getBlog(blogId: number): Promise<GetBlogDomain> {
        const blogEntity: BlogEntity =
            await this.blogRepository.getBlog(blogId);
        return new GetBlogDomain(blogEntity);
    }

    async getBlogs(query: GetBlogsQueryDto): Promise<GetBlogDomain[]> {
        const blogs = await this.blogRepository.getBlogs(query);
        return blogs.map((blog) => new GetBlogDomain(blog));
    }
}
