import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../repository/user.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDTO } from '../dto/request/create.user.request';
import { UserEntity } from '../entities/user.entity';

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
                        },
                        $transaction: jest.fn().mockImplementation(
                            (callback) => callback(prismaService), // $transaction 내에서 prismaService 사용
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
            const createUserDTO: CreateUserDTO = {
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
                email: createUserDTO.email,
                name: createUserDTO.name,
                password: createUserDTO.password,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                isLft: false,
                githubUrl: createUserDTO.githubUrl,
                blogUrl: createUserDTO.blogUrl,
                mainPosition: createUserDTO.mainPosition,
                subPosition: createUserDTO.subPosition,
                school: createUserDTO.school,
                class: createUserDTO.class,
                roleId: 3,
                isAuth: true,
                year: createUserDTO.year,
            };

            // findUnique 메서드를 목킹하여 이메일 중복을 확인
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
                null,
            );

            // create 메서드를 목킹하여 사용자가 생성되었는지 확인
            (prismaService.user.create as jest.Mock).mockResolvedValue(newUser);

            const callback = jest.fn();

            const result = await userRepository.createUser(
                createUserDTO,
                callback,
            );

            // findUnique가 올바르게 호출되었는지 확인
            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email: createUserDTO.email },
            });
            // create 메서드가 호출되었는지 확인
            expect(prismaService.user.create).toHaveBeenCalledWith({
                data: {
                    ...createUserDTO,
                    roleId: 3, // 기본 roleId
                    isAuth: true, // 인증된 사용자로 표시
                },
                include: { profiles: true },
            });
            // 콜백 함수가 호출되었는지 확인
            expect(callback).toHaveBeenCalledWith(newUser);
            // 반환값 확인
            expect(result).toEqual(newUser);
        });

        it('이메일이 중복되면 에러를 발생시켜야 한다', async () => {
            const createUserDTO: CreateUserDTO = {
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
                email: createUserDTO.email,
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
                year: createUserDTO.year,
            };

            // findUnique 메서드를 중복된 유저로 목킹
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
                existingUser,
            );

            // 중복된 이메일로 생성 시 에러가 발생하는지 확인
            await expect(
                userRepository.createUser(createUserDTO, jest.fn()),
            ).rejects.toThrow('이미 해당 이메일로 등록된 사용자가 있습니다.');
        });
    });

    describe('findUserByEmail', () => {
        it('이메일로 사용자를 찾아야 한다', async () => {
            const email = 'test@test.com';

            const user: UserEntity = {
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
                roleId: 3,
                isAuth: true,
                year: 3,
            };

            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
                user,
            );

            const result = await userRepository.findUserByEmail(email);

            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email },
                include: { profiles: true },
            });
            expect(result).toEqual(user);
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
