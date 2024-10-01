import { Injectable } from '@nestjs/common';
import { BlogRepository } from './repository/blog.repository';
import { CreateBlogDto } from './dto/request/create.blog.dto';
import { BlogEntity } from './entities/blog.entity';
import { GetBlogDto } from './dto/response/get.blog.dto';
import { GetBlogsQueryDto } from './dto/request/get.blog.query.dto';
import { PaginationQueryDto } from './dto/request/pagination.query.dto';
import { UpdateBlogDto } from './dto/request/update.blog.dto';

@Injectable()
export class BlogService {
    constructor(private readonly blogRepository: BlogRepository) {}

    async createBlog(createBlogDomain: CreateBlogDto): Promise<GetBlogDto> {
        const blogEntity: BlogEntity =
            await this.blogRepository.createBlog(createBlogDomain);
        return new GetBlogDto(blogEntity);
    }

    async getBlog(blogId: number): Promise<GetBlogDto> {
        const blogEntity: BlogEntity =
            await this.blogRepository.getBlog(blogId);
        return new GetBlogDto(blogEntity);
    }

    async getBlogList(query: GetBlogsQueryDto): Promise<GetBlogDto[]> {
        const blogs = await this.blogRepository.getBlogList(query);
        return blogs.map((blog) => new GetBlogDto(blog));
    }

    async getBlogsByUser(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<GetBlogDto[]> {
        // todo: 유저가 존재하는지 검사
        const blogs = await this.blogRepository.getBlogsByUser(userId, query);
        return blogs.map((blog) => new GetBlogDto(blog));
    }

    async deleteBlog(blogId: number): Promise<void> {
        await this.blogRepository.getBlog(blogId); // 게시물 존재 여부 검사
        return this.blogRepository.deleteBlog(blogId);
    }

    async updateBlog(
        blogId: number,
        updateBlogDto: UpdateBlogDto,
    ): Promise<GetBlogDto> {
        await this.blogRepository.getBlog(blogId); // 게시물 존재 여부 검사
        const blog = await this.blogRepository.updateBlog(
            blogId,
            updateBlogDto,
        );
        return new GetBlogDto(blog);
    }

    async getBestBlogs(query: PaginationQueryDto): Promise<GetBlogDto[]> {
        const blogs = await this.blogRepository.getBestBlogs(query);
        return blogs.map((blog) => new GetBlogDto(blog));
    }
}
