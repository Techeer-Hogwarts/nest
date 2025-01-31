import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../repository/user.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserRequest } from '../dto/request/create.user.request';
import { UpdateUserRequest } from '../dto/request/update.user.request';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';
import { StackCategory } from '../../../global/category/stack.category';

describe('UserRepository', () => {
    let userRepository: UserRepository;
    let prismaService: PrismaService;
    let logger: CustomWinstonLogger;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserRepository,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            findUnique: jest.fn(),
                            create: jest.fn().mockResolvedValue({}),
                            update: jest.fn(),
                            findMany: jest.fn(),
                        },
                        permissionRequest: {
                            create: jest.fn(),
                            updateMany: jest.fn(),
                            findMany: jest.fn(),
                        },
                    },
                },
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        debug: jest.fn(),
                        error: jest.fn(),
                    },
                },
            ],
        }).compile();

        userRepository = module.get<UserRepository>(UserRepository);
        prismaService = module.get<PrismaService>(PrismaService);
        logger = module.get<CustomWinstonLogger>(CustomWinstonLogger);
    });

    describe('createUser', () => {
        it('should throw error if mainPosition is invalid', async () => {
            const createUserRequest = {
                mainPosition: 'InvalidPosition',
            } as CreateUserRequest;
            const profileImage = 'http://profileimage.com';

            jest.spyOn(
                userRepository,
                'validateAndNormalizePosition',
            ).mockImplementation(() => {
                throw new Error('Invalid position');
            });

            jest.spyOn(logger, 'debug').mockImplementation();

            await expect(
                userRepository.createUser(createUserRequest, profileImage),
            ).rejects.toThrow('Invalid position');

            expect(logger.debug).toHaveBeenCalledWith(
                'createUser mainPosition validation failed',
                expect.objectContaining({
                    mainPosition: 'InvalidPosition',
                    error: 'Invalid position',
                }),
            );
        });
    });

    describe('updateUserProfile', () => {
        it('should validate and normalize positions before updating', async () => {
            const userId = 1;
            const updateUserRequest: UpdateUserRequest = {
                school: 'New Hogwarts',
                grade: '2학년',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                githubUrl: 'https://github.com/newuser',
                velogUrl: 'https://newblog.com',
                mediumUrl: 'https://newblog.com',
                tistoryUrl: 'https://newblog.com',
                isLft: false,
            };

            jest.spyOn(
                userRepository,
                'validateAndNormalizePosition',
            ).mockReturnValueOnce(StackCategory.BACKEND);
            jest.spyOn(
                userRepository,
                'validateAndNormalizePosition',
            ).mockReturnValueOnce(StackCategory.FRONTEND);

            await userRepository.updateUserProfile(userId, updateUserRequest);

            expect(
                userRepository.validateAndNormalizePosition,
            ).toHaveBeenNthCalledWith(1, 'Backend');
            expect(
                userRepository.validateAndNormalizePosition,
            ).toHaveBeenNthCalledWith(2, 'Frontend');

            expect(prismaService.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: expect.objectContaining({
                    mainPosition: 'BACKEND',
                    subPosition: 'FRONTEND',
                    school: 'New Hogwarts',
                    grade: '2학년',
                    githubUrl: 'https://github.com/newuser',
                    velogUrl: 'https://newblog.com',
                    mediumUrl: 'https://newblog.com',
                    tistoryUrl: 'https://newblog.com',
                    isLft: false,
                }),
            });
        });

        it('should handle errors during update', async () => {
            const userId = 1;
            const updateUserRequest: UpdateUserRequest = {
                school: 'New Hogwarts',
                grade: '2학년',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                githubUrl: 'https://github.com/newuser',
                velogUrl: 'https://newblog.com',
                mediumUrl: 'https://newblog.com',
                tistoryUrl: 'https://newblog.com',
                isLft: false,
            };

            jest.spyOn(
                userRepository,
                'validateAndNormalizePosition',
            ).mockImplementation(() => {
                throw new Error('Invalid position');
            });

            jest.spyOn(logger, 'debug').mockImplementation();

            await expect(
                userRepository.updateUserProfile(userId, updateUserRequest),
            ).rejects.toThrow('Invalid position');

            expect(logger.debug).toHaveBeenCalledWith(
                'updateUserProfile validation failed',
                expect.objectContaining({
                    updatedData: expect.objectContaining({
                        school: 'New Hogwarts',
                        grade: '2학년',
                        mainPosition: 'Backend',
                        subPosition: 'Frontend',
                    }),
                    error: 'Invalid position',
                }),
            );
        });
    });
});
