import { BlogEntity } from '../entities/blog.entity';
import { GetBlogResponse } from '../dto/response/get.blog.response';
import { GetBlogsQueryRequest } from '../dto/request/get.blog.query.request';
import { PaginationQueryDto } from '../../../global/pagination/pagination.query.dto';
import { BlogCategory } from '../../../global/category/blog.category';

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
        tags: ['sql'],
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
            mediumUrl: 'blog',
            velogUrl: 'velog',
            tistoryUrl: 'tistory',
            mainPosition: 'Backend',
            subPosition: 'DevOps',
            school: 'Test University',
            grade: '4학년',
            profileImage: 'profile-image-url',
            stack: [], // 빈 배열 기본값
            isAuth: true,
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
};

export const getBlogResponseList: GetBlogResponse[] = blogEntities.map(
    (blog: BlogEntity) => new GetBlogResponse(blog),
);

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
