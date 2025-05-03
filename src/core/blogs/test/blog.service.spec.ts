import { Test, TestingModule } from '@nestjs/testing';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { GetBlogsQueryRequest } from '../../../common/dto/blogs/request/get.blog.query.request';
import { CrawlingBlogResponse } from '../../../common/dto/blogs/response/crawling.blog.response';
import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
import { IndexService } from '../../../infra/index/index.service';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { TaskService } from '../../task/task.service';
import { BlogService } from '../blog.service';
import { BlogNotFoundException } from '../exception/blog.exception';

describe('BlogService', () => {
    let blogService: BlogService;
    let prismaService: any;
    let logger: CustomWinstonLogger;

    const mockBlog = {
        id: 1,
        isDeleted: false,
        user: {},
    };

    const mockCrawlingBlogDto: CrawlingBlogResponse = {
        userId: 1,
        blogUrl: 'https://velog.io/@test',
        posts: [
            {
                title: '테스트 블로그',
                url: 'https://velog.io/@test/테스트',
                date: '2025-04-24',
                tags: [],
                thumbnail: '',
                author: '',
                authorImage: '',
            },
        ],
        category: 'TECHEER',
        updatePosts: jest.fn(),
    };

    const mockUserList = [
        {
            id: 1,
            tistoryUrl: 'https://tistory.com/test',
            mediumUrl: null,
            velogUrl: 'https://velog.io/@test',
        },
    ];

    beforeEach(async () => {
        const mockPrismaService = {
            blog: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                create: jest.fn(),
            },
            user: {
                findMany: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BlogService,
                {
                    provide: TaskService,
                    useValue: {
                        requestSharedPostFetch: jest.fn(),
                    },
                },
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: IndexService,
                    useValue: {
                        createIndex: jest.fn(),
                        deleteIndex: jest.fn(),
                    },
                },
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        log: jest.fn(),
                        error: jest.fn(),
                        warn: jest.fn(),
                        debug: jest.fn(),
                    },
                },
            ],
        }).compile();

        blogService = module.get(BlogService);
        prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
        logger = module.get(
            CustomWinstonLogger,
        ) as jest.Mocked<CustomWinstonLogger>;
    });

    describe('getBlog', () => {
        it('블로그를 단일 조회한다', async () => {
            prismaService.blog.findUnique.mockResolvedValue(mockBlog);
            const result = await blogService.getBlog(1);
            expect(result).toBeDefined();
        });

        it('존재하지 않는 블로그일시 예외를 던진다', async () => {
            prismaService.blog.findUnique.mockResolvedValue(null);
            await expect(blogService.getBlog(999)).rejects.toThrow(
                BlogNotFoundException,
            );
        });
    });

    describe('increaseBlogViewCount', () => {
        it('블로그의 조회수를 증가시킨다', async () => {
            prismaService.blog.update.mockResolvedValue({ viewCount: 11 });
            await blogService.increaseBlogViewCount(1);
            expect(prismaService.blog.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { viewCount: { increment: 1 } },
            });
        });
    });

    describe('getBlogList', () => {
        it('카테고리에 해당하는 블로그 목록을 조회한다', async () => {
            prismaService.blog.findMany.mockResolvedValue([mockBlog]);
            const query: GetBlogsQueryRequest = {
                category: 'TECHEER',
                offset: 0,
                limit: 10,
            };
            const result = await blogService.getBlogList(query);
            expect(result).toHaveLength(1);
        });
    });

    describe('getBestBlogs', () => {
        it('인기 블로그 목록을 반환한다', async () => {
            prismaService.blog.findMany.mockResolvedValue([
                {
                    ...mockBlog,
                    viewCount: 5,
                    likeCount: 2,
                },
                {
                    ...mockBlog,
                    viewCount: 10,
                    likeCount: 0,
                },
            ]);
            const result = await blogService.getBestBlogs({
                offset: 0,
                limit: 10,
            });
            expect(result.length).toBe(2);
        });
    });

    describe('deleteBlog', () => {
        it('블로그를 삭제한다', async () => {
            prismaService.blog.update.mockResolvedValue(mockBlog);
            const result = await blogService.deleteBlog(1);
            expect(result).toBeDefined();
            expect(prismaService.blog.update).toHaveBeenCalledWith({
                where: {
                    id: 1,
                    isDeleted: false,
                },
                data: { isDeleted: true },
                include: { user: true },
            });
            expect(logger.debug).toHaveBeenCalled();
        });

        it('존재하지 않는 블로그 삭제 시 예외를 던진다', async () => {
            const prismaError = new PrismaClientKnownRequestError(
                'Record to update not found',
                {
                    code: 'P2025',
                    clientVersion: '4.x.x',
                } as any,
            );

            prismaService.blog.update.mockRejectedValueOnce(prismaError);

            await expect(blogService.deleteBlog(999)).rejects.toThrow(
                BlogNotFoundException,
            );
            expect(logger.warn).toHaveBeenCalledWith(
                '블로그 삭제 실패 - 존재하지 않거나 이미 삭제된 blogId: 999',
                'BlogService',
            );
        });
    });

    describe('createBlog', () => {
        it('블로그를 생성한다', async () => {
            prismaService.blog.create.mockResolvedValue({
                ...mockCrawlingBlogDto.posts[0],
                id: 1,
                user: {},
            });
            await blogService.createBlog(mockCrawlingBlogDto);
            expect(prismaService.blog.create).toHaveBeenCalled();
        });

        it('오류 발생 시 예외를 던진다', async () => {
            prismaService.blog.create.mockRejectedValueOnce(
                new Error('DB insert error'),
            );
            await expect(
                blogService.createBlog(mockCrawlingBlogDto),
            ).resolves.not.toThrow();
            expect(logger.error).toHaveBeenCalled();
        });
    });

    describe('getAllUserBlogUrl', () => {
        it('특정 유저의 모든 블로그 목록을 반환한다', async () => {
            prismaService.user.findMany.mockResolvedValue(mockUserList);
            const result = await blogService.getAllUserBlogUrl();
            expect(result[0].blogUrls.length).toBeGreaterThan(0);
        });
    });

    describe('createSharedBlog', () => {
        it('외부 블로그 게시를 요청한다', async () => {
            const taskService = (blogService as any).taskService;
            const spy = jest.spyOn(taskService, 'requestSharedPostFetch');
            await blogService.createSharedBlog(1, 'https://test.com');
            expect(spy).toHaveBeenCalled();
        });
    });
});
