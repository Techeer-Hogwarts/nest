import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../repository/user.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserRequest } from '../dto/request/create.user.request';
import { UserEntity } from '../entities/user.entity';
import { ConflictException } from '@nestjs/common';

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
                            findUnique: jest.fn(),
                            create: jest.fn(),
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
                name: 'Test User',
                year: 3,
                isLft: false,
                githubUrl: 'https://github.com/test',
                blogUrl: 'https://blog.com/test',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                school: 'Test School',
                class: '재학',
            };

            const newUser: UserEntity = {
                id: 1,
                email: createUserRequest.email,
                name: createUserRequest.name,
                password: createUserRequest.password,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                isLft: false,
                githubUrl: createUserRequest.githubUrl,
                blogUrl: createUserRequest.blogUrl,
                mainPosition: createUserRequest.mainPosition,
                subPosition: createUserRequest.subPosition,
                school: createUserRequest.school,
                class: createUserRequest.class,
                roleId: 3,
                isAuth: true,
                year: createUserRequest.year,
            };

            // 이메일 중복 체크
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
                null,
            );

            // 사용자를 생성할 때 콜백 호출
            (prismaService.user.create as jest.Mock).mockResolvedValue(newUser);

            const callback = jest.fn();

            const result = await userRepository.createUser(
                createUserRequest,
                callback,
            );

            // findUnique가 올바르게 호출되었는지 확인
            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email: createUserRequest.email },
                include: { profiles: true }, // include 옵션 추가
            });
            // create 메서드가 호출되었는지 확인
            expect(prismaService.user.create).toHaveBeenCalledWith({
                data: {
                    ...createUserRequest,
                    roleId: 3,
                    isAuth: true,
                },
                include: { profiles: true },
            });
            // 콜백 함수가 호출되었는지 확인
            expect(callback).toHaveBeenCalledWith(newUser);
            // 반환값 확인
            expect(result).toEqual(newUser);
        });

        it('이메일이 중복되면 ConflictException을 던져야 한다', async () => {
            const createUserRequest: CreateUserRequest = {
                email: 'test@test.com',
                password: 'password123',
                name: 'Test User',
                year: 3,
                isLft: false,
                githubUrl: 'https://github.com/test',
                blogUrl: 'https://blog.com/test',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                school: 'Test School',
                class: '재학',
            };

            const existingUser: UserEntity = {
                id: 1,
                email: createUserRequest.email,
                name: 'Test User',
                password: 'password123',
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                isLft: false,
                githubUrl: 'https://github.com/test',
                blogUrl: 'https://blog.com/test',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                school: 'Test School',
                class: '재학',
                roleId: 3,
                isAuth: true,
                year: createUserRequest.year,
            };

            // 중복된 사용자로 목킹
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
                existingUser,
            );

            await expect(
                userRepository.createUser(createUserRequest, jest.fn()),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('findUserByEmail', () => {
        it('이메일로 사용자를 찾아야 한다', async () => {
            const email = 'test@test.com';
            const existingUser: UserEntity = {
                id: 1,
                email,
                name: 'Test User',
                password: 'password123',
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                isLft: false,
                githubUrl: 'https://github.com/test',
                blogUrl: 'https://blog.com/test',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                school: 'Test School',
                class: '졸업',
                roleId: 1,
                isAuth: true,
                year: 3,
            };

            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
                existingUser,
            );

            await expect(userRepository.findUserByEmail(email)).rejects.toThrow(
                ConflictException,
            );
        });

        it('사용자를 찾을 수 없으면 null을 반환해야 한다', async () => {
            const email = 'nonexistent@test.com';

            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
                null,
            );

            const result = await userRepository.findUserByEmail(email);

            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email },
                include: { profiles: true },
            });
            expect(result).toBeNull();
        });
    });
});
