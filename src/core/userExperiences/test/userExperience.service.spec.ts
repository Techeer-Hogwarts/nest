import { Test, TestingModule } from '@nestjs/testing';

import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
import { StackCategory } from '../../../common/category/stack.category';

import { PrismaService } from '../../../infra/prisma/prisma.service';
import { UserExperienceService } from '../userExperience.service';

import { CreateUserExperienceRequest } from '../../../common/dto/userExperiences/request/create.userExperience.request';

import {
    UserExperienceInvalidCategoryException,
    UserExperienceInvalidPositionException,
    UserExperienceNotFoundExperienceException,
} from '../exception/userExperience.exception';

import { UserExperienceEmployment } from '../category/userExperienceEmployment';

describe('UserExperienceService', () => {
    let service: UserExperienceService;
    let prisma: PrismaService;
    let logger: CustomWinstonLogger;

    const mockPrismaService = {
        userExperience: {
            createMany: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            findUnique: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserExperienceService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        log: jest.fn(),
                        error: jest.fn(),
                        debug: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UserExperienceService>(UserExperienceService);
        prisma = module.get<PrismaService>(PrismaService);
        logger = module.get<CustomWinstonLogger>(CustomWinstonLogger);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('validateAndNormalizePosition', () => {
        it('정상적인 position은 StackCategory로 반환한다', () => {
            const result = service.validateAndNormalizePosition('Frontend');
            expect(result).toBe(StackCategory.FRONTEND);
            expect(logger.debug).toHaveBeenCalledWith(
                '포지션 변환 완료: FRONTEND',
                'UserExperienceService',
            );
        });

        it('유효하지 않은 position은 예외를 던진다', () => {
            expect(() => {
                service.validateAndNormalizePosition('Fronten');
            }).toThrow(UserExperienceInvalidPositionException);
            expect(logger.error).toHaveBeenCalledWith(
                '유효하지 않은 포지션 값입니다: Fronten',
                'UserExperienceService',
            );
        });
    });

    describe('validateCategory', () => {
        it('정상적인 category는 Category로 반환한다', () => {
            const result = service.validateCategory('인턴');
            expect(result).toBe(UserExperienceEmployment.INTERN);
            expect(logger.debug).toHaveBeenCalledWith(
                '카테고리 검증 완료: 인턴',
                'UserExperienceService',
            );
        });

        it('유효하지 않은 category는 예외를 던진다', () => {
            expect(() => {
                service.validateCategory('Inter');
            }).toThrow(UserExperienceInvalidCategoryException);
            expect(logger.error).toHaveBeenCalledWith(
                '유효하지 않은 카테고리 값입니다: Inter',
                'UserExperienceService',
            );
        });
    });

    describe('transformExperienceData', () => {
        it('사용자 경력 데이터를 변환한다', () => {
            const input: CreateUserExperienceRequest[] = [
                {
                    position: 'Frontend',
                    companyName: '호그와트',
                    category: '인턴',
                    startDate: '2025-03-25',
                    endDate: '2025-12-20',
                },
            ];

            const result = service.transformExperienceData(input, 1);

            expect(result[0].userId).toBe(1);
            expect(result[0].position).toBe(StackCategory.FRONTEND);
            expect(result[0].category).toBe(UserExperienceEmployment.INTERN);
            expect(result[0].startDate instanceof Date).toBe(true);
            expect(result[0].isFinished).toBe(true);

            expect(logger.debug).toHaveBeenCalledWith(
                expect.stringContaining('경험 데이터 변환 완료:'),
                'UserExperienceService',
            );
        });

        it('endDate가 null이면 isFinished는 false다', () => {
            const input: CreateUserExperienceRequest[] = [
                {
                    position: 'Frontend',
                    companyName: '호그와트',
                    category: '인턴',
                    startDate: '2025-03-25',
                    endDate: null,
                },
            ];

            const result = service.transformExperienceData(input, 2);
            expect(result[0].endDate).toBeNull();
            expect(result[0].isFinished).toBe(false);
        });
    });

    describe('createUserExperience', () => {
        it('변환된 데이터를 createMany로 저장한다', async () => {
            const req = {
                experiences: [
                    {
                        position: 'Frontend',
                        companyName: '호그와트',
                        category: '인턴',
                        startDate: '2025-03-25',
                        endDate: '2025-12-20',
                    },
                ],
            };

            await service.createUserExperience(req, 1);

            expect(prisma.userExperience.createMany).toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        userId: 1,
                        position: StackCategory.FRONTEND,
                        companyName: '호그와트',
                        category: UserExperienceEmployment.INTERN,
                        startDate: new Date('2025-03-25'),
                        endDate: new Date('2025-12-20'),
                        isFinished: true,
                    }),
                ]),
            });
            expect(logger.debug).toHaveBeenCalledWith(
                '경험 생성 완료',
                'UserExperienceService',
            );
        });
    });

    describe('updateUserExperience', () => {
        it('experienceId가 있으면 update, 없으면 create 처리한다', async () => {
            const req = {
                experiences: [
                    {
                        experienceId: 1,
                        position: 'Frontend',
                        companyName: '호그와트',
                        category: '인턴',
                        startDate: '2025-03-25',
                        endDate: '2025-12-20',
                    },
                    {
                        position: 'Frontend',
                        companyName: '호그와트',
                        category: '인턴',
                        startDate: '2025-03-25',
                        endDate: null,
                    },
                ],
            };

            (prisma.userExperience.update as jest.Mock).mockResolvedValue({});
            (prisma.userExperience.create as jest.Mock).mockResolvedValue({});

            await service.updateUserExperience(1, req);

            expect(prisma.userExperience.update).toHaveBeenCalled();
            expect(prisma.userExperience.create).toHaveBeenCalled();

            expect(logger.debug).toHaveBeenCalledWith(
                '경험 업데이트: id=1',
                'UserExperienceService',
            );

            expect(logger.debug).toHaveBeenCalledWith(
                '경험 생성',
                'UserExperienceService',
            );

            expect(logger.debug).toHaveBeenCalledWith(
                '경험 업데이트 완료',
                'UserExperienceService',
            );
        });
    });

    describe('deleteUserExperience', () => {
        it('경력 데이터가 존재하고 userID가 일치하면 삭제해야 한다', async () => {
            (prisma.userExperience.findUnique as jest.Mock).mockResolvedValue({
                userId: 1,
            });

            await service.deleteUserExperience(1, 10);

            expect(prisma.userExperience.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: { isDeleted: true },
            });
            expect(logger.debug).toHaveBeenCalledWith(
                '경험 삭제 완료',
                'UserExperienceService',
            );
        });

        it('경력 데이터가 존재하지 않을 경우 예외를 던진다', async () => {
            (prisma.userExperience.findUnique as jest.Mock).mockResolvedValue(
                null,
            );

            await expect(service.deleteUserExperience(1, 99)).rejects.toThrow(
                UserExperienceNotFoundExperienceException,
            );
            expect(logger.error).toHaveBeenCalledWith(
                '경험 삭제 실패',
                'UserExperienceService',
            );
        });

        it('사용자의 경력이 아닐 경우 예외를 던진다', async () => {
            (prisma.userExperience.findUnique as jest.Mock).mockResolvedValue({
                userId: 2,
            });

            await expect(service.deleteUserExperience(1, 99)).rejects.toThrow(
                UserExperienceNotFoundExperienceException,
            );
            expect(logger.error).toHaveBeenCalledWith(
                '경험 삭제 실패',
                'UserExperienceService',
            );
        });
    });
});
