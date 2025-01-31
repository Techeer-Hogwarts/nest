import { Injectable } from '@nestjs/common';
import { BlogRepository } from './repository/blog.repository';
import { BlogEntity } from './entities/blog.entity';
import { GetBlogResponse } from './dto/response/get.blog.response';
import { GetBlogsQueryRequest } from './dto/request/get.blog.query.request';
import { PaginationQueryDto } from '../../global/pagination/pagination.query.dto';

@Injectable()
export class BlogService {
    constructor(private readonly blogRepository: BlogRepository) {}

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

    async getBestBlogs(query: PaginationQueryDto): Promise<GetBlogResponse[]> {
        const blogs: BlogEntity[] =
            await this.blogRepository.getBestBlogs(query);
        return blogs.map((blog: BlogEntity) => new GetBlogResponse(blog));
    }
}
