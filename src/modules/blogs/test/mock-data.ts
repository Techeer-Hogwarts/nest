// mock-data.ts
import { BlogEntity } from '../entities/blog.entity';
import { CreateBlogRequest } from '../dto/request/create.blog.request';
import { GetBlogResponse } from '../dto/response/get.blog.response';
import { GetBlogsQueryRequest } from '../dto/request/get.blog.query.request';
import { UpdateBlogRequest } from '../dto/request/update.blog.request';
import { PaginationQueryDto } from '../../../global/common/pagination.query.dto';

export const createBlogDto: CreateBlogRequest = {
    userId: 1,
    title: 'Test Post',
    url: 'https://example.com/blog',
    date: new Date('2024-09-24T08:51:54.000Z'),
    category: 'Backend',
};

export const blogEntity = (overrides?: Partial<BlogEntity>): BlogEntity => {
    return {
        id: 1,
        userId: createBlogDto.userId,
        title: createBlogDto.title,
        url: createBlogDto.url,
        date: createBlogDto.date,
        category: createBlogDto.category,
        createdAt: createBlogDto.date,
        updatedAt: createBlogDto.date,
        isDeleted: false,
        likeCount: 0,
        viewCount: 0,
        user: {
            id: createBlogDto.userId,
            createdAt: createBlogDto.date,
            updatedAt: createBlogDto.date,
            isDeleted: false,
            name: 'testName',
            email: 'test@test.com',
            year: 2024,
            password: '1234',
            isLft: false,
            githubUrl: 'github',
            blogUrl: 'blog',
            mainPosition: 'Backend',
            subPosition: 'DevOps',
            school: 'Test University',
            class: '4학년',
            roleId: 1,
            isAuth: true,
        },
        ...overrides,
    };
};

export const blogEntities: BlogEntity[] = [
    blogEntity({ id: 1 }),
    blogEntity({ id: 2 }),
];

export const getBlogsQueryDto: GetBlogsQueryRequest = {
    keyword: 'Test',
    category: 'Backend',
    position: 'Backend',
    offset: 0,
    limit: 10,
};

export const getBlogDto: GetBlogResponse = new GetBlogResponse(blogEntity());

export const getBlogDtoList: GetBlogResponse[] = blogEntities.map(
    (blog) => new GetBlogResponse(blog),
);

export const updateBlogDto: UpdateBlogRequest = {
    title: 'Updated Title',
    url: 'https://example.com/updated-blog',
    date: createBlogDto.date,
};

export const updatedBlogEntity: BlogEntity = blogEntity({
    ...updateBlogDto,
});

export const paginationQueryDto: PaginationQueryDto = {
    offset: 0,
    limit: 10,
};

export const bestBlogEntities: BlogEntity[] = [
    blogEntity({
        id: 1,
        viewCount: 100,
        likeCount: 5,
    }),
    blogEntity({
        id: 2,
        viewCount: 150,
        likeCount: 3,
    }),
    blogEntity({
        id: 3,
        viewCount: 80,
        likeCount: 10,
    }),
    blogEntity({
        id: 4,
        viewCount: 120,
        likeCount: 2,
    }),
    blogEntity({
        id: 5,
        viewCount: 50,
        likeCount: 12,
    }),
];

export const getBestBlogDtoList: GetBlogResponse[] = bestBlogEntities.map(
    (blog) => new GetBlogResponse(blog),
);
