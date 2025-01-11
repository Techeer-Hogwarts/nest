import { LikeRepository } from '../repository/like.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ContentCategory, Prisma } from '@prisma/client';
import { CreateLikeRequest } from '../dto/request/create.like.request';
import { sessionEntity } from '../../sessions/test/mock-data';
import {
    createLikeRequest,
    getLikeListRequest,
    likeEntities,
    likeEntity,
} from './mock-data';

describe('LikeRepository', (): void => {
    let repository: LikeRepository;
    let prismaService: PrismaService;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LikeRepository,
                {
                    provide: PrismaService,
                    useValue: {
                        session: {
                            findUnique: jest.fn(),
                            update: jest.fn(),
                        },
                        blog: {
                            findUnique: jest.fn(),
                            update: jest.fn(),
                        },
                        resume: {
                            findUnique: jest.fn(),
                            update: jest.fn(),
                        },
                        like: {
                            findUnique: jest.fn(),
                            upsert: jest.fn(),
                            count: jest.fn(),
                            update: jest.fn(),
                        },
                        $queryRaw: jest.fn(),
                        $transaction: jest.fn(async (callback) => {
                            return await callback(prismaService);
                        }),
                    },
                },
                {
                    provide: 'REDIS_CLIENT',
                    useValue: {
                        get: jest.fn(),
                        set: jest.fn(),
                        incr: jest.fn(),
                        decr: jest.fn(),
                    },
                },
            ],
        }).compile();

        repository = module.get<LikeRepository>(LikeRepository);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', (): void => {
        expect(repository).toBeDefined();
    });

    describe('isContentExist', (): void => {
        it('해당 콘텐츠가 존재함', async (): Promise<void> => {
            jest.spyOn(prismaService.session, 'findUnique').mockResolvedValue(
                sessionEntity(),
            );

            const result: boolean = await repository.isContentExist(
                1,
                ContentCategory.SESSION,
            );

            expect(result).toEqual(true);
            expect(prismaService.session.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 1,
                    isDeleted: false,
                },
            });
            expect(prismaService.session.findUnique).toHaveBeenCalledTimes(1);
        });

        it('해당 콘텐츠가 존재하지 않음', async (): Promise<void> => {
            jest.spyOn(prismaService.blog, 'findUnique').mockResolvedValue(
                null,
            );

            const result: boolean = await repository.isContentExist(
                1,
                ContentCategory.BLOG,
            );

            expect(result).toEqual(false);
            expect(prismaService.blog.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 1,
                    isDeleted: false,
                },
            });
            expect(prismaService.blog.findUnique).toHaveBeenCalledTimes(1);
        });
    });

    describe('toggleLike', (): void => {
        it('좋아요 적용 시 트랜잭션이 올바르게 호출됨', async (): Promise<void> => {
            const request: CreateLikeRequest = createLikeRequest();

            // `like` 모의 객체 생성
            jest.spyOn(prismaService.like, 'upsert').mockResolvedValue(
                likeEntity(),
            );

            // 모든 키 포함하는 `contentTableMap` 모의 객체 생성
            const mockContentTable = {
                update: jest.fn().mockResolvedValue({ likeCount: 5 }),
            };
            const mockContentTableMap = {
                RESUME: mockContentTable,
                SESSION: mockContentTable,
                BLOG: mockContentTable,
            };

            // `contentTableMap`에 접근할 수 있도록 설정
            (repository as any).contentTableMap = mockContentTableMap;

            const transactionSpy = jest.spyOn(prismaService, '$transaction');

            await repository.toggleLike(1, request);

            expect(transactionSpy).toHaveBeenCalledTimes(1);
            expect(prismaService.like.upsert).toHaveBeenCalledWith({
                where: {
                    userId_contentId_category: {
                        userId: 1,
                        contentId: request.contentId,
                        category: request.category,
                    },
                },
                update: { isDeleted: !request.likeStatus },
                create: {
                    userId: 1,
                    contentId: request.contentId,
                    category: request.category,
                    isDeleted: !request.likeStatus,
                },
            });

            // `update`가 올바르게 호출되었는지 확인
            expect(mockContentTable.update).toHaveBeenCalledWith({
                where: { id: request.contentId },
                data: { likeCount: { increment: request.likeStatus ? 1 : -1 } },
            });
        });
    });

    describe('getLikeList', (): void => {
        it('유저의 좋아요 목록을 가져옴', async (): Promise<void> => {
            jest.spyOn(prismaService, '$queryRaw').mockResolvedValue(
                likeEntities,
            );

            const result = await repository.getLikeList(
                1,
                getLikeListRequest(),
            );

            expect(result).toEqual(likeEntities);
            expect(prismaService.$queryRaw).toHaveBeenCalledWith(
                Prisma.sql`
            SELECT l.*, c.*
            FROM "Like" l
            LEFT JOIN ${Prisma.raw('"Resume"')} c ON l."contentId" = c."id"
            WHERE l."userId" = ${1}
              AND l."category" = CAST(${'RESUME'} AS "ContentCategory")
              AND l."isDeleted" = false
            ORDER BY l."createdAt" DESC
            LIMIT ${getLikeListRequest().limit} OFFSET ${getLikeListRequest().offset}
        `,
            );
            expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
        });
    });

    describe('getLikeCount', (): void => {
        it('DB에서 좋아요 개수를 조회함', async (): Promise<void> => {
            jest.spyOn(prismaService.like, 'count').mockResolvedValue(10);

            const contentId = 1;
            const category = ContentCategory.SESSION;

            const result = await repository.getLikeCount(contentId, category);

            expect(result).toEqual(10);
            expect(prismaService.like.count).toHaveBeenCalledWith({
                where: {
                    contentId,
                    category,
                    isDeleted: false,
                },
            });
            expect(prismaService.like.count).toHaveBeenCalledTimes(1);
        });
    });
});
