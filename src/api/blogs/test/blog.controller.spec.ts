import { CanActivate } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';

import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
import { RequestUser } from '../../../common/dto/users/request/user.interface';

import { JwtAuthGuard } from '../../../core/auth/jwt.guard';

import { BlogController } from '../blog.controller';

import { BlogService } from '../../../core/blogs/blog.service';

import { GetBlogsQueryRequest } from '../../../common/dto/blogs/request/get.blog.query.request';
import { PaginationQueryDto } from '../../../common/pagination/pagination.query.dto';
import { GetBlogResponse } from '../../../common/dto/blogs/response/get.blog.response';

class MockJwtAuthGuard implements CanActivate {
    canActivate(): boolean {
        return true;
    }
}

describe('BlogController', () => {
    let blogController: BlogController;
    let blogService: jest.Mocked<BlogService>;

    const mockUser: User = {
        id: 1,
        name: '김테커',
        nickname: '김김테커',
        roleId: 1,
        profileImage: 'https://test.com/image.jpg',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        password: 'passW0rd1!',
        githubUrl: '',
        mainPosition: '',
        subPosition: '',
        year: 4,
        isLft: false,
        tistoryUrl: '',
        velogUrl: '',
        mediumUrl: '',
        school: '',
        stack: ['BACKEND', 'FRONTEND'],
        isAuth: false,
        grade: '1',
    };

    const mockBlog = new GetBlogResponse({
        id: 1,
        title: '블로그 테스트',
        url: 'https://test.com',
        author: 'tester',
        authorImage: 'https://test.com/image.jpg',
        thumbnail: 'https://test.com/thumbnail.jpg',
        date: new Date(),
        tags: [],
        viewCount: 0,
        likeCount: 0,
        category: 'TECHEER',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 1,
        user: mockUser,
        isDeleted: false,
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BlogController],
            providers: [
                {
                    provide: BlogService,
                    useValue: {
                        createSharedBlog: jest.fn(),
                        increaseBlogViewCount: jest.fn(),
                        getBestBlogs: jest.fn().mockResolvedValue([mockBlog]),
                        getBlogList: jest.fn().mockResolvedValue([mockBlog]),
                        getBlogsByUser: jest.fn().mockResolvedValue([mockBlog]),
                        getBlog: jest.fn().mockResolvedValue(mockBlog),
                        deleteBlog: jest.fn().mockResolvedValue(mockBlog),
                    },
                },
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        debug: jest.fn(),
                    },
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useClass(MockJwtAuthGuard)
            .compile();

        blogController = module.get(BlogController);
        blogService = module.get(BlogService) as jest.Mocked<BlogService>;
    });

    describe('createSharedBlog', () => {
        it('외부 블로그 게시를 요청한다', async () => {
            const user: RequestUser = { id: 1 } as RequestUser;
            await blogController.createSharedBlog(user, 'https://example.com');

            expect(blogService.createSharedBlog).toHaveBeenCalledWith(
                1,
                'https://example.com',
            );
        });
    });

    describe('increaseBlogViewCount', () => {
        it('블로그의 조회수를 증가시킨다', async () => {
            await blogController.increaseBlogViewCount(1);
            expect(blogService.increaseBlogViewCount).toHaveBeenCalledWith(1);
        });
    });

    describe('getBestBlogs', () => {
        it('인기 블로그 목록을 반환한다', async () => {
            const result = await blogController.getBestBlogs({
                offset: 0,
                limit: 5,
            });

            expect(blogService.getBestBlogs).toHaveBeenCalledWith({
                offset: 0,
                limit: 5,
            });
            expect(result).toMatchObject([mockBlog]);
        });
    });

    describe('getBlogList', () => {
        it('모든 블로그 목록을 반환한다', async () => {
            const query: GetBlogsQueryRequest = {
                category: 'TECHEER',
                offset: 0,
                limit: 10,
            };

            const result = await blogController.getBlogList(query);

            expect(blogService.getBlogList).toHaveBeenCalledWith(query);
            expect(result).toMatchObject([mockBlog]);
        });
    });

    describe('getBlogsByUser', () => {
        it('특정 유저의 블로그 목록을 반환한다', async () => {
            const query: PaginationQueryDto = {
                offset: 0,
                limit: 10,
            };

            const result = await blogController.getBlogsByUser(1, query);

            expect(blogService.getBlogsByUser).toHaveBeenCalledWith(1, query);
            expect(result).toMatchObject([mockBlog]);
        });
    });

    describe('getBlog', () => {
        it('단일 블로그를 반환한다', async () => {
            const result = await blogController.getBlog(1);

            expect(blogService.getBlog).toHaveBeenCalledWith(1);
            expect(result).toMatchObject(mockBlog);
        });
    });

    describe('deleteBlog', () => {
        it('블로그를 삭제한다', async () => {
            const result = await blogController.deleteBlog(1);

            expect(blogService.deleteBlog).toHaveBeenCalledWith(1);
            expect(result).toMatchObject(mockBlog);
        });
    });
});
