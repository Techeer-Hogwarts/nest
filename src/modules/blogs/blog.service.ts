import { Injectable } from '@nestjs/common';
import { BlogRepository } from './repository/blog.repository';
import { BlogEntity } from './entities/blog.entity';
import { GetBlogResponse } from './dto/response/get.blog.response';
import { GetBlogsQueryRequest } from './dto/request/get.blog.query.request';
import { PaginationQueryDto } from '../../global/common/pagination.query.dto';
import { UpdateBlogRequest } from './dto/request/update.blog.request';

@Injectable()
export class BlogService {
    constructor(private readonly blogRepository: BlogRepository) {}

    async getBlog(blogId: number): Promise<GetBlogResponse> {
        const blogEntity: BlogEntity =
            await this.blogRepository.getBlog(blogId);
        return new GetBlogResponse(blogEntity);
    }

    async getBlogList(query: GetBlogsQueryRequest): Promise<GetBlogResponse[]> {
        const blogs: BlogEntity[] =
            await this.blogRepository.getBlogList(query);
        return blogs.map((blog: BlogEntity) => new GetBlogResponse(blog));
    }

    async getBlogsByUser(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<GetBlogResponse[]> {
        const blogs: BlogEntity[] = await this.blogRepository.getBlogsByUser(
            userId,
            query,
        );
        return blogs.map((blog: BlogEntity) => new GetBlogResponse(blog));
    }

    async deleteBlog(blogId: number): Promise<void> {
        return this.blogRepository.deleteBlog(blogId);
    }

    async updateBlog(
        blogId: number,
        updateBlogRequest: UpdateBlogRequest,
    ): Promise<GetBlogResponse> {
        const blog: BlogEntity = await this.blogRepository.updateBlog(
            blogId,
            updateBlogRequest,
        );
        return new GetBlogResponse(blog);
    }

    async getBestBlogs(query: PaginationQueryDto): Promise<GetBlogResponse[]> {
        const blogs: BlogEntity[] =
            await this.blogRepository.getBestBlogs(query);
        return blogs.map((blog: BlogEntity) => new GetBlogResponse(blog));
    }
}
