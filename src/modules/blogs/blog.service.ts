import { Injectable } from '@nestjs/common';
import { BlogRepository } from './repository/blog.repository';
import { BlogEntity } from './entities/blog.entity';
import { GetBlogResponse } from './dto/response/get.blog.response';
import { GetBlogsQueryRequest } from './dto/request/get.blog.query.request';
import { PaginationQueryDto } from '../../global/pagination/pagination.query.dto';
import { TaskService } from '../../global/task/task.service';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';

@Injectable()
export class BlogService {
    constructor(
        private readonly blogRepository: BlogRepository,
        private readonly taskService: TaskService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    async createSharedBlog(userId: number, url: string): Promise<void> {
        await this.taskService.requestSharedPostFetch(userId, url);
    }

    async getBlogList(query: GetBlogsQueryRequest): Promise<GetBlogResponse[]> {
        const blogs: BlogEntity[] =
            await this.blogRepository.getBlogList(query);
        this.logger.debug(
            `${blogs.length}개의 블로그 엔티티 목록 조회 성공 후 GetBlogResponse로 변환 중`,
            BlogService.name,
        );
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
        this.logger.debug(
            `${blogs.length}개의 유저 별 블로그 엔티티 목록 조회 성공 후 GetBlogResponse로 변환 중`,
            BlogService.name,
        );
        return blogs.map((blog: BlogEntity) => new GetBlogResponse(blog));
    }

    async getBestBlogs(query: PaginationQueryDto): Promise<GetBlogResponse[]> {
        const blogs: BlogEntity[] =
            await this.blogRepository.getBestBlogs(query);
        this.logger.debug(
            `${blogs.length}개의 인기글 블로그 엔티티 목록 조회 성공 후 GetBlogResponse로 변환 중`,
            BlogService.name,
        );
        return blogs.map((blog: BlogEntity) => new GetBlogResponse(blog));
    }
}
