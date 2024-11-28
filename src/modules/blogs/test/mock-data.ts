import { BlogEntity } from '../entities/blog.entity';
import { GetBlogResponse } from '../dto/response/get.blog.response';
import { GetBlogsQueryRequest } from '../dto/request/get.blog.query.request';
import { UpdateBlogRequest } from '../dto/request/update.blog.request';
import { PaginationQueryDto } from '../../../global/common/pagination.query.dto';
import { BlogCategory } from '@prisma/client';

export const blogEntity = (overrides?: Partial<BlogEntity>): BlogEntity => {
    return {
        id: 1,
        createdAt: new Date('2024-09-24T08:51:54.000Z'),
        updatedAt: new Date('2024-09-24T08:51:54.000Z'),
        isDeleted: false,
        userId: 1,
        title: 'Test Post',
        url: 'https://example.com/blog',
        thumbnail: 'https://example.com/thumbnail',
        author: 'authorTest',
        authorImage: 'https://example.com/author',
        date: new Date('2024-09-24T08:51:54.000Z'),
        category: BlogCategory.TECHEER,
        tag: ['sql'],
        likeCount: 0,
        viewCount: 0,
        user: {
            id: 1,
            createdAt: new Date('2024-09-24T08:51:54.000Z'),
            updatedAt: new Date('2024-09-24T08:51:54.000Z'),
            isDeleted: false,
            name: '홍길동',
            email: 'hong@test.com',
            nickname: 'hong123', // 예시 데이터 추가
            year: 2024,
            password: '1234',
            isLft: false,
            githubUrl: 'github',
            blogUrl: 'blog',
            mainPosition: 'Backend',
            subPosition: 'DevOps',
            school: 'Test University',
            class: '4학년',
            profileImage: 'profile-image-url',
            stack: [], // 빈 배열 기본값
            isAuth: true,
            isIntern: true,
            internPosition: 'Intern Developer',
            internCompanyName: 'Intern Corp',
            internStartDate: new Date('2024-01-01T00:00:00.000Z'),
            internEndDate: new Date('2024-06-01T00:00:00.000Z'),
            fullTimePosition: 'Full-Time Developer',
            isFullTime: false,
            fullTimeCompanyName: 'Full-Time Corp',
            fullTimeStartDate: new Date('2024-07-01T00:00:00.000Z'),
            fullTimeEndDate: new Date('2024-12-31T00:00:00.000Z'),
            roleId: 1,
        },
        ...overrides,
    };
};

export const blogEntities: BlogEntity[] = [
    blogEntity({ id: 1 }),
    blogEntity({ id: 2 }),
];

export const getBlogsQueryRequest: GetBlogsQueryRequest = {
    keyword: 'Test',
    category: BlogCategory.TECHEER,
    offset: 0,
    limit: 10,
    sort: 'ASC',
};

export const getBlogResponse: GetBlogResponse = new GetBlogResponse(
    blogEntity(),
);

export const getBlogResponseList: GetBlogResponse[] = blogEntities.map(
    (blog: BlogEntity) => new GetBlogResponse(blog),
);

export const updateBlogRequest: UpdateBlogRequest = {
    title: 'Updated Title',
    url: 'https://example.com/updated-blog',
    date: new Date('2024-09-24T08:51:54.000Z'),
};

export const updatedBlogEntity: BlogEntity = blogEntity({
    ...updateBlogRequest,
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

export const getBestBlogResponseList: GetBlogResponse[] = bestBlogEntities.map(
    (blog: BlogEntity) => new GetBlogResponse(blog),
);
