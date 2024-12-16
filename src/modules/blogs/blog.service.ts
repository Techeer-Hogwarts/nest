import { Injectable, Logger } from '@nestjs/common';
import { BlogRepository } from './repository/blog.repository';
import { BlogEntity } from './entities/blog.entity';
import { GetBlogResponse } from './dto/response/get.blog.response';
import { GetBlogsQueryRequest } from './dto/request/get.blog.query.request';
import { PaginationQueryDto } from '../../global/common/pagination.query.dto';
import { UpdateBlogRequest } from './dto/request/update.blog.request';
import { CrawlingBlogResponse } from './dto/response/crawling.blog.response';

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
        // todo: 유저가 존재하는지 검사
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

    async createBlog(crawlingBlogDto: CrawlingBlogResponse): Promise<void> {
        const { userId, posts } = crawlingBlogDto;

        // 어제 날짜 계산
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0); // 어제 날짜의 시작
        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setHours(23, 59, 59, 999); // 어제 날짜의 끝
        Logger.debug(yesterday);
        Logger.debug(endOfYesterday);

        // 어제 날짜에 해당하는 글만 필터링
        const filteredPosts = posts.filter((post) => {
            const postDate = new Date(post.date);
            return postDate >= yesterday && postDate <= endOfYesterday;
        });

        Logger.debug(
            `어제 날짜의 글 ${filteredPosts.length}개를 필터링했습니다.`,
            'FilteredPosts',
        );
        Logger.debug(filteredPosts);
        await this.blogRepository.createBlog(
            new CrawlingBlogResponse(userId, filteredPosts),
        );
    }
}
