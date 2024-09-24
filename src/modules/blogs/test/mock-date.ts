// mock-data.ts
import { BlogEntity } from '../entities/blog.entity';
import { CreateBlogDto } from '../dto/request/create.blog.dto';
import { GetBlogDto } from '../dto/response/get.blog.dto';
import { GetBlogsQueryDto } from '../dto/request/get.blog.query.dto';
import { UpdateBlogDto } from '../dto/request/update.blog.dto';
import { PaginationQueryDto } from '../dto/request/pagination.query.dto';

export const createBlogDto: CreateBlogDto = {
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
        },
        ...overrides,
    };
};

export const blogEntities: BlogEntity[] = [
    blogEntity({ id: 1 }),
    blogEntity({ id: 2 }),
];

export const getBlogsQueryDto: GetBlogsQueryDto = {
    keyword: 'Test',
    category: 'Backend',
    position: 'Backend',
    offset: 0,
    limit: 10,
};

export const getBlogDto: GetBlogDto = new GetBlogDto(blogEntity());

export const getBlogDtoList: GetBlogDto[] = blogEntities.map(
    (blog) => new GetBlogDto(blog),
);

export const updateBlogDto: UpdateBlogDto = {
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

export const getBestBlogDtoList: GetBlogDto[] = bestBlogEntities.map(
    (blog) => new GetBlogDto(blog),
);
