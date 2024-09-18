import { Injectable } from '@nestjs/common';
import { BlogRepository } from './repository/blog.repository';
import { CreateBlogDomain } from './dto/request/create.blog.domain';
import { BlogEntity } from './entities/blog.entity';
import { GetBlogDomain } from './dto/response/get.blog.domain';
import { GetBlogsQueryDto } from './dto/request/get.blog.query.dto';
import { PaginationQueryDto } from './dto/request/pagination.query.dto';

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

    async getBlogsByUserId(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<GetBlogDomain[]> {
        // todo: 유저가 존재하는지 검사
        const blogs = await this.blogRepository.getBlogsByUserId(userId, query);
        return blogs.map((blog) => new GetBlogDomain(blog));
    }

    async deleteBlog(blogId: number): Promise<void> {
        await this.blogRepository.getBlog(blogId); // 게시물 존재 여부 검사
        return this.blogRepository.deleteBlog(blogId);
    }
}
