import { PrismaService } from '../../../infra/prisma/prisma.service';
import { IndexService } from '../../../infra/index/index.service';
import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
import { LikeService } from '../like.service';
import { CreateLikeRequest } from '../../../common/dto/likes/request/create.like.request';
import { GetLikeListRequest } from '../../../common/dto/likes/request/get.like-list.request';
import { GetLikeResponse } from '../../../common/dto/likes/response/get.like.response';
import { GetSessionResponse } from '../../../common/dto/sessions/response/get.session.response';
import { GetBlogResponse } from '../../../common/dto/blogs/response/get.blog.response';
import { GetResumeResponse } from '../../../common/dto/resumes/response/get.resume.response';
import { GetProjectTeamListResponse } from '../../../common/dto/projectTeams/response/get.projectTeamList.response';
import { GetStudyTeamListResponse } from '../../../common/dto/studyTeams/response/get.studyTeamList.response';
import {
    LikeContentNotFoundException,
    LikeDuplicateRequestException,
} from '../exception/like.exception';
import { IndexSessionRequest } from '../../../common/dto/sessions/request/index.session.request';
import { mock, MockProxy } from 'jest-mock-extended';

describe('LikeService', () => {
    let service: LikeService;
    let mockPrismaService: MockProxy<PrismaService>;
    let indexService: MockProxy<IndexService>;
    let logger: MockProxy<CustomWinstonLogger>;

    const categories = [
        'SESSION',
        'BLOG',
        'RESUME',
        'PROJECT',
        'STUDY',
    ] as const;
    type Category = (typeof categories)[number];

    const tableNameMap = {
        SESSION: 'session',
        BLOG: 'blog',
        RESUME: 'resume',
        PROJECT: 'projectTeam',
        STUDY: 'studyTeam',
    } as const;

    beforeEach(async () => {
        // 모든 mock을 한번에 설정
        mockPrismaService = mock<PrismaService>({
            session: {
                update: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
            },
            blog: {
                update: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
            },
            resume: {
                update: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
            },
            projectTeam: {
                update: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
            },
            studyTeam: {
                update: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
            },
            like: {
                findUnique: jest.fn(),
                upsert: jest.fn(),
                findMany: jest.fn(),
            },
        });

        indexService = mock<IndexService>();
        logger = mock<CustomWinstonLogger>();

        service = new LikeService(logger, mockPrismaService, indexService);
    });

    describe('toggleLike', () => {
        it('좋아요 생성이 성공적으로 이루어져야 함', async () => {
            const userId = 1;
            const createLikeRequest: CreateLikeRequest = {
                contentId: 1,
                category: 'RESUME' as Category,
                likeStatus: true,
            };

            jest.spyOn(service, 'isContentExist').mockResolvedValue(true);

            jest.spyOn(logger, 'debug').mockImplementation(() => {});

            mockPrismaService.$transaction.mockImplementation(
                async (callback) => {
                    const transactionPrisma = {
                        like: {
                            findUnique: jest.fn().mockResolvedValue(null),
                            upsert: jest.fn().mockResolvedValue({
                                id: 1,
                                userId,
                                contentId: 1,
                                category: 'RESUME',
                                isDeleted: false,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            }),
                        },
                        resume: {
                            table: {
                                update: jest.fn().mockResolvedValue({
                                    id: 1,
                                    userId: 1,
                                    title: 'Test Resume',
                                    description: 'Test Description',
                                    url: 'resume.com',
                                    isMain: true,
                                    isDeleted: false,
                                    likeCount: 1,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                }),
                            },
                        },
                        session: {
                            table: {
                                update: jest.fn().mockResolvedValue({
                                    id: 1,
                                    likeCount: 1,
                                    title: 'Test Session',
                                    userId: 1,
                                    isDeleted: false,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                    videoUrl: 'video.mp4',
                                    fileUrl: 'file.pdf',
                                    presenter: 'Presenter',
                                    date: '2024-03-20T00:00:00.000Z',
                                    thumbnail: 'thumbnail.jpg',
                                    position: 'position',
                                    viewCount: 0,
                                }),
                            },
                        },
                    } as unknown as PrismaService;
                    return callback(transactionPrisma);
                },
            );

            const result = await service.toggleLike(userId, createLikeRequest);

            expect(result).toBeInstanceOf(GetLikeResponse);
        });

        it('좋아요 취소가 성공적으로 이루어져야 함', async () => {
            const userId = 1;
            const createLikeRequest: CreateLikeRequest = {
                contentId: 1,
                category: 'RESUME' as Category,
                likeStatus: false,
            };

            jest.spyOn(service, 'isContentExist').mockResolvedValue(true);

            mockPrismaService.$transaction.mockImplementation(
                async (callback) => {
                    const transactionPrisma = {
                        like: {
                            findUnique: jest.fn().mockResolvedValue({
                                id: 1,
                                userId,
                                contentId: 1,
                                category: 'RESUME',
                                isDeleted: false,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            }),
                            upsert: jest.fn().mockResolvedValue({
                                id: 1,
                                userId,
                                contentId: 1,
                                category: 'RESUME',
                                isDeleted: true,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            }),
                        },
                        resume: {
                            findUnique: jest.fn(),
                            update: jest.fn().mockResolvedValue({
                                id: 1,
                                likeCount: 0,
                                title: 'Test Resume',
                                userId: 1,
                                isDeleted: false,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            }),
                            findMany: jest.fn(),
                        },
                    } as unknown as PrismaService;
                    return callback(transactionPrisma);
                },
            );

            const result = await service.toggleLike(userId, createLikeRequest);
            expect(result).toBeInstanceOf(GetLikeResponse);
        });

        it('콘텐츠가 존재하지 않을 경우 LikeContentNotFoundException을 발생시켜야 함', async () => {
            const userId = 1;
            const createLikeRequest: CreateLikeRequest = {
                contentId: 999,
                category: 'RESUME' as Category,
                likeStatus: true,
            };

            jest.spyOn(service, 'isContentExist').mockResolvedValue(false);

            await expect(
                service.toggleLike(userId, createLikeRequest),
            ).rejects.toThrow(LikeContentNotFoundException);
            expect(logger.debug).toHaveBeenCalledWith(
                '해당 콘텐츠를 찾을 수 없음',
                'LikeService',
            );
        });

        it('SESSION 카테고리의 경우 인덱스가 업데이트되어야 함', async () => {
            const userId = 1;
            const createLikeRequest: CreateLikeRequest = {
                contentId: 1,
                category: 'SESSION' as Category,
                likeStatus: true,
            };

            jest.spyOn(service, 'isContentExist').mockResolvedValue(true);

            // session.update 메서드 mock (contentTableMap을 통해 접근됨)
            mockPrismaService.session.update = jest.fn().mockResolvedValue({
                id: 1,
                userId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                title: 'Test Session',
                likeCount: 1,
                viewCount: 0,
                thumbnail: 'thumbnail.jpg',
                videoUrl: 'video.mp4',
                fileUrl: 'file.pdf',
                presenter: 'Test Presenter',
                date: '2024-03-20T00:00:00.000Z',
                category: 'SESSION',
                position: 'position',
            });

            mockPrismaService.$transaction.mockImplementation(
                async (callback) => {
                    const transactionPrisma = {
                        like: {
                            findUnique: jest.fn().mockResolvedValue(null),
                            upsert: jest.fn().mockResolvedValue({
                                id: 1,
                                userId,
                                contentId: 1,
                                category: 'SESSION',
                                isDeleted: false,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            }),
                        },
                        session: mockPrismaService.session, // 실제 contentTableMap이 사용하는 것과 동일한 객체 사용
                    } as unknown as PrismaService;
                    return callback(transactionPrisma);
                },
            );

            const result = await service.toggleLike(userId, createLikeRequest);

            expect(result).toBeInstanceOf(GetLikeResponse);

            // indexService.createIndex 호출 검증 시 IndexSessionRequest 사용
            const createIndexCalls = (indexService.createIndex as jest.Mock)
                .mock.calls;
            const passedRequest = createIndexCalls[0][1];
            expect(passedRequest).toBeInstanceOf(IndexSessionRequest); // 인스턴스 타입 검증

            // 필드 값 검증
            expect(passedRequest).toEqual(
                expect.objectContaining({
                    date: '2024-03-20T00:00:00.000Z',
                    id: '1',
                    likeCount: '1',
                    presenter: 'Test Presenter',
                    thumbnail: 'thumbnail.jpg',
                    title: 'Test Session',
                    viewCount: '0',
                }),
            );
        });

        it('이미 좋아요한 콘텐츠에 대해 좋아요 시도 시 LikeDuplicateRequestException을 발생시켜야 함', async () => {
            const userId = 1;
            const createLikeRequest: CreateLikeRequest = {
                contentId: 1,
                category: 'RESUME' as Category,
                likeStatus: true,
            };

            jest.spyOn(service, 'isContentExist').mockResolvedValue(true);

            mockPrismaService.$transaction.mockImplementation(
                async (callback) => {
                    const transactionPrisma = {
                        like: {
                            findUnique: jest.fn().mockResolvedValue({
                                id: 1,
                                userId,
                                contentId: 1,
                                category: 'RESUME',
                                isDeleted: false,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            }),
                        },
                    } as unknown as PrismaService;
                    return callback(transactionPrisma);
                },
            );

            await expect(
                service.toggleLike(userId, createLikeRequest),
            ).rejects.toThrow(LikeDuplicateRequestException);
        });
    });

    describe('getLikeList', () => {
        categories.forEach((category) => {
            it(`${category} 카테고리에 대한 좋아요 목록을 반환해야 함`, async () => {
                const userId = 1;
                const request: GetLikeListRequest = {
                    category: category,
                    offset: 0,
                    limit: 10,
                };

                const now = new Date();
                const mockLikes = [
                    {
                        id: 1,
                        userId,
                        contentId: 1,
                        category,
                        isDeleted: false,
                        createdAt: now,
                        updatedAt: now,
                    },
                ];

                const mockContent = {
                    id: 1,
                    title: `${category} Title`,
                    userId,
                    category,
                    isDeleted: false,
                    createdAt: now,
                    updatedAt: now,
                    likeCount: 1,
                    viewCount: 0,
                    date: now.toISOString(),
                    thumbnail: 'thumbnail.jpg',
                    position: 'position',
                    user: {
                        id: userId,
                        name: 'Test User',
                    },
                    ...(category === 'SESSION' && {
                        videoUrl: 'video.mp4',
                        fileUrl: 'file.pdf',
                        presenter: 'Presenter',
                    }),
                    ...(category === 'PROJECT' && {
                        resultImages: [],
                        teamStacks: [],
                        isRecruited: false,
                        isFinished: false,
                        githubLink: 'github.com',
                        deployLink: 'deploy.com',
                        recruitExplain: 'explain',
                    }),
                    ...(category === 'STUDY' && {
                        resultImages: [],
                        isRecruited: false,
                        isFinished: false,
                        recruitExplain: 'explain',
                    }),
                    ...(category === 'BLOG' && {
                        url: 'blog.com',
                        author: 'Author',
                        authorImage: 'author.jpg',
                        tags: ['tag1', 'tag2'],
                    }),
                    ...(category === 'RESUME' && {
                        url: 'resume.com',
                        isMain: true,
                    }),
                };

                const tableName = tableNameMap[category];

                (
                    mockPrismaService.like.findMany as jest.Mock
                ).mockResolvedValue(mockLikes);
                (
                    mockPrismaService[tableName].findMany as jest.Mock
                ).mockResolvedValue([mockContent]);

                const result = await service.getLikeList(userId, request);

                expect(Array.isArray(result)).toBe(true);
                expect(result.length).toBe(1);
                expect(result[0]).toBeInstanceOf(
                    category === 'SESSION'
                        ? GetSessionResponse
                        : category === 'BLOG'
                          ? GetBlogResponse
                          : category === 'RESUME'
                            ? GetResumeResponse
                            : category === 'PROJECT'
                              ? GetProjectTeamListResponse
                              : GetStudyTeamListResponse,
                );
                expect(logger.debug).toHaveBeenCalledWith(
                    `좋아요 목록 조회 시작 - userId: ${userId}, category: ${category}`,
                    'LikeService',
                );
            });
        });

        it('페이지네이션이 올바르게 동작해야 함', async () => {
            const userId = 1;
            const request: GetLikeListRequest = {
                category: 'RESUME',
                offset: 2,
                limit: 5,
            };

            const mockLikes = Array(5)
                .fill(null)
                .map((_, i) => ({
                    userId,
                    contentId: i + 3,
                    category: 'RESUME',
                    isDeleted: false,
                }));

            (mockPrismaService.like.findMany as jest.Mock).mockResolvedValue(
                mockLikes,
            );
            (mockPrismaService.resume.findMany as jest.Mock).mockResolvedValue(
                mockLikes.map((like) => ({
                    id: like.contentId,
                    title: `Resume ${like.contentId}`,
                    userId,
                    user: { id: userId },
                })),
            );

            const result = await service.getLikeList(userId, request);

            expect(mockPrismaService.like.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 2,
                    take: 5,
                }),
            );
            expect(result.length).toBe(5);
        });
    });

    describe('isContentExist', () => {
        categories.forEach((category) => {
            it(`${category} 카테고리의 콘텐츠 존재 여부를 확인해야 함`, async () => {
                const contentId = 1;
                const now = new Date();
                const tableName = tableNameMap[category];

                const mockContent = {
                    id: contentId,
                    userId: 1,
                    category,
                    isDeleted: false,
                    createdAt: now,
                    updatedAt: now,
                    title: 'Title',
                    likeCount: 0,
                    viewCount: 0,
                    date: now.toISOString(),
                    thumbnail: 'thumbnail.jpg',
                    position: 'position',
                    ...(category === 'SESSION' && {
                        videoUrl: 'video.mp4',
                        fileUrl: 'file.pdf',
                        presenter: 'Presenter',
                    }),
                };

                (
                    mockPrismaService[tableName].findUnique as jest.Mock
                ).mockResolvedValue(mockContent);

                const result = await service.isContentExist(
                    contentId,
                    category,
                );
                expect(result).toBe(true);
                expect(logger.debug).toHaveBeenCalledWith(
                    `콘텐츠 존재 여부 검사 시작 - contentId: ${contentId}, category: ${category}`,
                    'LikeService',
                );
                expect(logger.debug).toHaveBeenCalledWith(
                    '콘텐츠 존재 여부 검사 성공 - true',
                    'LikeService',
                );
            });

            it(`${category} 콘텐츠가 존재하지 않을 경우 false를 반환해야 함`, async () => {
                const contentId = 999;
                const tableName = tableNameMap[category];

                (
                    mockPrismaService[tableName].findUnique as jest.Mock
                ).mockResolvedValue(null);

                const result = await service.isContentExist(
                    contentId,
                    category,
                );

                expect(result).toBe(false);
            });
        });
    });
});
