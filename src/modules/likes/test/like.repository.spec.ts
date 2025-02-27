import { LikeRepository } from '../repository/like.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateLikeRequest } from '../dto/request/create.like.request';
import { sessionEntity } from '../../sessions/test/mock-data';
import { createLikeRequest, likeEntity } from './mock-data';
import { ContentCategory } from '../../../global/category/content.category';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';
import { IndexService } from '../../../global/index/index.service';

describe('LikeRepository', (): void => {
    let repository: LikeRepository;
    let prisma: PrismaService;

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
                            create: jest.fn(),
                        },
                        $queryRaw: jest.fn(),
                        $transaction: jest.fn(async (callback) => {
                            return await callback(prisma);
                        }),
                    },
                },
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        debug: jest.fn(),
                        error: jest.fn(),
                    },
                },
                {
                    provide: IndexService,
                    useValue: {},
                },
            ],
        }).compile();

        repository = module.get<LikeRepository>(LikeRepository);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', (): void => {
        expect(repository).toBeDefined();
    });

    describe('isContentExist', (): void => {
        it('해당 콘텐츠가 존재함', async (): Promise<void> => {
            jest.spyOn(prisma.session, 'findUnique').mockResolvedValue(
                sessionEntity(),
            );

            const result: boolean = await repository.isContentExist(
                1,
                ContentCategory.SESSION,
            );

            expect(result).toEqual(true);
            expect(prisma.session.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 1,
                    isDeleted: false,
                },
            });
            expect(prisma.session.findUnique).toHaveBeenCalledTimes(1);
        });

        it('해당 콘텐츠가 존재하지 않음', async (): Promise<void> => {
            jest.spyOn(prisma.blog, 'findUnique').mockResolvedValue(null);

            const result: boolean = await repository.isContentExist(
                1,
                ContentCategory.BLOG,
            );

            expect(result).toEqual(false);
            expect(prisma.blog.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 1,
                    isDeleted: false,
                },
            });
            expect(prisma.blog.findUnique).toHaveBeenCalledTimes(1);
        });
    });

    describe('toggleLike', (): void => {
        it('좋아요 적용 시 트랜잭션이 올바르게 호출됨', async (): Promise<void> => {
            const request: CreateLikeRequest = createLikeRequest();
            const likeStatus = request.likeStatus;

            jest.spyOn(prisma.like, 'upsert').mockResolvedValue(likeEntity());
            jest.spyOn(prisma.resume, 'update').mockResolvedValue({} as any);

            const transactionSpy = jest
                .spyOn(prisma, '$transaction')
                .mockImplementation(async (cb: any) => {
                    return cb(prisma);
                });

            await repository.toggleLike(1, request);

            // 트랜잭션이 1회 호출되었는지 확인
            expect(transactionSpy).toHaveBeenCalledTimes(1);

            // 트랜잭션이 콜백을 받았는지 확인
            expect(transactionSpy).toHaveBeenCalledWith(expect.any(Function));

            // upsert 검증
            expect(prisma.like.upsert).toHaveBeenCalledWith({
                where: {
                    userId_contentId_category: {
                        userId: 1,
                        contentId: request.contentId,
                        category: request.category,
                    },
                },
                update: { isDeleted: !likeStatus },
                create: {
                    userId: 1,
                    contentId: request.contentId,
                    category: request.category,
                    isDeleted: !likeStatus,
                },
            });

            // resume.update가 likeStatus에 따라 증가/감소하는지 확인
            expect(prisma.resume.update).toHaveBeenCalledWith({
                where: { id: request.contentId },
                data: { likeCount: { increment: likeStatus ? 1 : -1 } },
            });
        });

        it('트랜잭션 내에서 에러 발생 시 롤백됨', async () => {
            const request: CreateLikeRequest = createLikeRequest();
            jest.spyOn(prisma.like, 'upsert').mockRejectedValue(
                new Error('DB Error'),
            );

            const transactionSpy = jest
                .spyOn(prisma, '$transaction')
                .mockImplementation(async (cb: any) => {
                    return cb(prisma);
                });

            await expect(repository.toggleLike(1, request)).rejects.toThrow(
                'DB Error',
            );

            // 트랜잭션이 실행되었는지 확인
            expect(transactionSpy).toHaveBeenCalledTimes(1);
            expect(transactionSpy).toHaveBeenCalledWith(expect.any(Function));
        });
    });

    describe('getLikeCount', (): void => {
        it('DB에서 좋아요 개수를 조회함', async (): Promise<void> => {
            jest.spyOn(prisma.like, 'count').mockResolvedValue(10);

            const contentId = 1;
            const category = ContentCategory.SESSION;

            const result = await repository.getLikeCount(contentId, category);

            expect(result).toEqual(10);
            expect(prisma.like.count).toHaveBeenCalledWith({
                where: {
                    contentId,
                    category,
                    isDeleted: false,
                },
            });
            expect(prisma.like.count).toHaveBeenCalledTimes(1);
        });
    });
});
