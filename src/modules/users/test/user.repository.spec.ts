import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../repository/user.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserRequest } from '../dto/request/create.user.request';
import { UserEntity } from '../entities/user.entity';
import { UpdateUserRequest } from '../dto/request/update.user.request';

describe('UserRepository', () => {
    let userRepository: UserRepository;
    let prismaService: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserRepository,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            findUnique: jest.fn(), // Prisma 메서드 목킹
                            create: jest.fn(), // Prisma 메서드 목킹
                            update: jest.fn(), // Prisma 메서드 목킹
                        },
                        $transaction: jest
                            .fn()
                            .mockImplementation((callback) =>
                                callback(prismaService),
                            ),
                    },
                },
            ],
        }).compile();

        userRepository = module.get<UserRepository>(UserRepository);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('정의되어 있어야 한다', () => {
        expect(userRepository).toBeDefined();
        expect(prismaService).toBeDefined();
    });

    describe('createUser', () => {
        it('사용자를 생성하고 콜백을 호출해야 한다', async () => {
            const createUserRequest: CreateUserRequest = {
                email: 'test@test.com',
                password: 'password123',
                name: 'test',
                year: 6,
                isLft: false,
                githubUrl: 'https://github.com/test',
                blogUrl: 'https://example.com/blog',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                school: 'Hogwarts',
                class: '1학년',
                profileImage: 'http://profileimage.com',
                isIntern: false,
                internCompanyName: 'crowdStrike',
                internPosition: 'Frontend',
                isFullTime: false,
                fullTimeCompanyName: 'paloalto',
                fullTimePosition: 'Backend',
            };

            const newUser: UserEntity = {
                id: 1,
                email: 'test@test.com',
                password: 'password123',
                name: 'test',
                year: 6,
                isLft: false,
                githubUrl: 'https://github.com/test',
                blogUrl: 'https://example.com/blog',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                school: 'Hogwarts',
                class: '1학년',
                profileImage: 'http://profileimage.com',
                isDeleted: false,
                roleId: 1,
                isAuth: true,
                nickname: 'tester',
                stack: ['JavaScript', 'NestJS'],
                isIntern: false,
                internCompanyName: 'crowdStrike',
                internPosition: 'Frontend',
                isFullTime: false,
                fullTimeCompanyName: 'paloalto',
                fullTimePosition: 'Backend',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // 사용자가 생성되었는지 확인하기 위한 create를 목킹
            (prismaService.user.create as jest.Mock).mockResolvedValue(newUser);

            const callback = jest.fn();

            const result = await userRepository.createUser(
                createUserRequest,
                callback,
            );

            // create 메서드가 호출되었는지 확인
            expect(prismaService.user.create).toHaveBeenCalledWith({
                data: {
                    ...createUserRequest,
                    roleId: 3, // 기본 roleId
                    isAuth: true,
                },
            });

            // 콜백 함수가 호출되었는지 확인
            expect(callback).toHaveBeenCalledWith(newUser);

            // 반환값 확인
            expect(result).toEqual(newUser);
        });
    });

    describe('findUserByEmail', () => {
        it('이메일로 사용자를 찾아야 한다', async () => {
            const email = 'test@test.com';

            const user: UserEntity = {
                id: 1,
                email,
                password: 'password123',
                name: 'test',
                year: 6,
                isLft: false,
                githubUrl: 'https://github.com/test',
                blogUrl: 'https://example.com/blog',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                school: 'Hogwarts',
                class: '1학년',
                profileImage: 'http://profileimage.com',
                isDeleted: false,
                roleId: 1,
                isAuth: true,
                nickname: 'tester',
                stack: ['JavaScript', 'NestJS'],
                isIntern: false,
                internCompanyName: 'crowdStrike',
                internPosition: 'Frontend',
                isFullTime: false,
                fullTimeCompanyName: 'paloalto',
                fullTimePosition: 'Backend',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
                user,
            );

            const result = await userRepository.findOneByEmail(email);

            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email },
            });
            expect(result).toEqual(user);
        });

        it('사용자를 찾을 수 없으면 null을 반환해야 한다', async () => {
            const email = 'nonexistent@test.com';

            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
                null,
            );

            const result = await userRepository.findOneByEmail(email);

            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email },
            });
            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('ID로 사용자를 찾아야 한다 (삭제되지 않은 사용자)', async () => {
            const userId = 1;

            const user: UserEntity = {
                id: userId,
                email: 'test@test.com',
                password: 'password123',
                name: 'test',
                year: 6,
                isLft: false,
                githubUrl: 'https://github.com/test',
                blogUrl: 'https://example.com/blog',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                school: 'Hogwarts',
                class: '1학년',
                profileImage: 'http://profileimage.com',
                isDeleted: false,
                roleId: 1,
                isAuth: true,
                nickname: 'tester',
                stack: ['JavaScript', 'NestJS'],
                isIntern: false,
                internCompanyName: 'crowdStrike',
                internPosition: 'Frontend',
                isFullTime: false,
                fullTimeCompanyName: 'paloalto',
                fullTimePosition: 'Backend',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
                user,
            );

            const result = await userRepository.findById(userId);

            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: {
                    id: userId,
                    isDeleted: false,
                },
            });
            expect(result).toEqual(user);
        });

        it('삭제된 사용자는 null을 반환해야 한다', async () => {
            const userId = 999;

            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
                null,
            );

            const result = await userRepository.findById(userId);

            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: {
                    id: userId,
                    isDeleted: false,
                },
            });
            expect(result).toBeNull();
        });
    });

    describe('updateUserProfile', () => {
        it('유저 프로필을 업데이트해야 한다', async () => {
            const userId = 1;
            const updateUserProfileDto: UpdateUserRequest = {
                profileImage: 'https://newprofileimage.com',
                school: 'New Hogwarts',
                class: '2학년',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                githubUrl: 'https://github.com/newuser',
                blogUrl: 'https://newblog.com',
                isLft: false,
                isIntern: false,
                internCompanyName: 'NewCrowdStrike',
                internPosition: 'Backend',
                isFullTime: true,
                fullTimeCompanyName: 'NewPaloAlto',
                fullTimePosition: 'Backend',
            };

            const updatedUser: UserEntity = {
                id: userId,
                email: 'test@test.com',
                password: 'password123',
                name: 'test',
                year: 6,
                isLft: false,
                githubUrl: updateUserProfileDto.githubUrl,
                blogUrl: updateUserProfileDto.blogUrl,
                mainPosition: updateUserProfileDto.mainPosition,
                subPosition: updateUserProfileDto.subPosition,
                school: updateUserProfileDto.school,
                class: updateUserProfileDto.class,
                profileImage: updateUserProfileDto.profileImage,
                isDeleted: false,
                roleId: 1,
                isAuth: true,
                nickname: 'tester',
                stack: ['JavaScript', 'NestJS'],
                isIntern: false,
                internCompanyName: 'NewCrowdStrike',
                internPosition: 'Backend',
                isFullTime: true,
                fullTimeCompanyName: 'NewPaloAlto',
                fullTimePosition: 'Backend',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prismaService.user.update as jest.Mock).mockResolvedValue(
                updatedUser,
            );

            const result = await userRepository.updateUserProfile(
                userId,
                updateUserProfileDto,
            );

            expect(prismaService.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { ...updateUserProfileDto },
            });
            expect(result).toEqual(updatedUser);
        });
    });

    describe('softDeleteUser', () => {
        it('유저를 소프트 삭제해야 한다', async () => {
            const userId = 1;
            const softDeletedUser: UserEntity = {
                id: userId,
                email: 'test@test.com',
                password: 'password123',
                name: 'test',
                year: 6,
                isDeleted: true,
                isAuth: true,
                nickname: 'tester',
                roleId: 1,
                githubUrl: 'https://github.com/test',
                blogUrl: 'https://example.com/blog',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                school: 'Hogwarts',
                class: '1학년',
                profileImage: 'http://profileimage.com',
                isLft: false,
                isIntern: false,
                internCompanyName: 'crowdStrike',
                internPosition: 'Frontend',
                isFullTime: false,
                fullTimeCompanyName: 'paloalto',
                fullTimePosition: 'Backend',
                stack: ['JavaScript', 'NestJS'],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            jest.spyOn(prismaService.user, 'update').mockResolvedValue(
                softDeletedUser,
            );

            const result = await userRepository.softDeleteUser(userId);

            expect(prismaService.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { isDeleted: true },
            });
            expect(result).toEqual(softDeletedUser);
        });
    });
});
