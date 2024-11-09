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
} from './mock-data';
import Redis from 'ioredis';

describe('LikeRepository', (): void => {
    let repository: LikeRepository;
    let prismaService: PrismaService;
    let redisClient: Redis;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LikeRepository,
                {
                    provide: PrismaService,
                    useValue: {
                        session: {
                            findUnique: jest.fn(),
                        },
                        blog: {
                            findUnique: jest.fn(),
                        },
                        resume: {
                            findUnique: jest.fn(),
                        },
                        like: {
                            findUnique: jest.fn(),
                            upsert: jest.fn(),
                            count: jest.fn(),
                        },
                        $queryRaw: jest.fn(),
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
        redisClient = module.get<Redis>('REDIS_CLIENT');
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
        it('좋아요 적용 시 Redis에 상태 업데이트 및 개수 증가', async (): Promise<void> => {
            const request: CreateLikeRequest = createLikeRequest();

            jest.spyOn(redisClient, 'get').mockResolvedValue('false');
            jest.spyOn(redisClient, 'set').mockResolvedValue('true');
            jest.spyOn(redisClient, 'incr').mockResolvedValue(1);

            await repository.toggleLike(request);

            expect(redisClient.get).toHaveBeenCalledWith(
                `like:${request.category}:${request.contentId}:${request.userId}`,
            );
            expect(redisClient.set).toHaveBeenCalledWith(
                `like:${request.category}:${request.contentId}:${request.userId}`,
                request.likeStatus.toString(),
            );
            expect(redisClient.incr).toHaveBeenCalledWith(
                `likeCount:${request.category}:${request.contentId}`,
            );
        });

        it('좋아요 취소 시 Redis에 상태 업데이트 및 개수 감소', async (): Promise<void> => {
            const request: CreateLikeRequest = createLikeRequest({
                likeStatus: false,
            });

            jest.spyOn(redisClient, 'get').mockResolvedValue('true');
            jest.spyOn(redisClient, 'set').mockResolvedValue('false');
            jest.spyOn(redisClient, 'decr').mockResolvedValue(0);

            await repository.toggleLike(request);

            expect(redisClient.get).toHaveBeenCalledWith(
                `like:${request.category}:${request.contentId}:${request.userId}`,
            );
            expect(redisClient.set).toHaveBeenCalledWith(
                `like:${request.category}:${request.contentId}:${request.userId}`,
                request.likeStatus.toString(),
            );
            expect(redisClient.decr).toHaveBeenCalledWith(
                `likeCount:${request.category}:${request.contentId}`,
            );
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
        it('Redis에서 좋아요 개수를 가져오고 캐시 미스 시 DB에서 조회하여 Redis에 저장함', async (): Promise<void> => {
            const contentId: number = 1;
            const category: ContentCategory = ContentCategory.SESSION;

            // 캐시 미스 설정
            jest.spyOn(redisClient, 'get').mockResolvedValue(null);
            jest.spyOn(repository, 'countLikes').mockResolvedValue(10);

            const result: number = await repository.getLikeCount(
                contentId,
                category,
            );

            expect(result).toEqual(10);
            expect(redisClient.get).toHaveBeenCalledWith(
                `likeCount:${category}:${contentId}`,
            );
            expect(repository.countLikes).toHaveBeenCalledWith(
                contentId,
                category,
            );
            expect(redisClient.set).toHaveBeenCalledWith(
                `likeCount:${category}:${contentId}`,
                '10',
            );
        });
    });
});
