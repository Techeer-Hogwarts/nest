import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../repository/user.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserRequest } from '../dto/request/create.user.request';
import { UserEntity } from '../entities/user.entity';
import { UpdateUserRequest } from '../dto/request/update.user.request';
import { GetUserssQueryRequest } from '../dto/request/get.user.query.request';

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
                            create: jest.fn().mockResolvedValue({}),
                            update: jest.fn(),
                            delete: jest.fn(),
                            updateMany: jest.fn(),
                            findMany: jest.fn().mockResolvedValue([]),
                        },
                        permissionRequest: {
                            create: jest.fn().mockResolvedValue({
                                userId: 1,
                                requestedRoleId: 2,
                                status: 'PENDING',
                            }),
                            findMany: jest.fn().mockResolvedValue([
                                {
                                    userId: 1,
                                    status: 'PENDING',
                                },
                            ]),
                            updateMany: jest.fn().mockResolvedValue({
                                count: 1,
                            }),
                        },
                    },
                },
            ],
        }).compile();

        userRepository = module.get<UserRepository>(UserRepository);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(userRepository).toBeDefined();
        expect(prismaService).toBeDefined();
    });

    describe('createUser', () => {
        it('should create a user and return the user entity', async () => {
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
                isIntern: false,
                internCompanyName: 'crowdStrike',
                internPosition: 'Frontend',
                isFullTime: false,
                fullTimeCompanyName: 'paloalto',
                fullTimePosition: 'Backend',
                internStartDate: null,
                internEndDate: null,
                fullTimeStartDate: null,
                fullTimeEndDate: null,
            };

            const newUser: UserEntity = {
                id: 1,
                email: createUserRequest.email,
                password: createUserRequest.password,
                name: createUserRequest.name,
                year: createUserRequest.year,
                isLft: createUserRequest.isLft,
                githubUrl: createUserRequest.githubUrl,
                blogUrl: createUserRequest.blogUrl,
                mainPosition: createUserRequest.mainPosition,
                subPosition: createUserRequest.subPosition,
                school: createUserRequest.school,
                class: createUserRequest.class,
                profileImage: 'http://profileimage.com',
                isDeleted: false,
                roleId: 3,
                isAuth: true,
                nickname: 'tester',
                stack: ['JavaScript', 'NestJS'],
                isIntern: false,
                internCompanyName: 'crowdStrike',
                internPosition: 'Frontend',
                isFullTime: false,
                fullTimeCompanyName: 'paloalto',
                fullTimePosition: 'Backend',
                internStartDate: null,
                internEndDate: null,
                fullTimeStartDate: null,
                fullTimeEndDate: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prismaService.user.create as jest.Mock).mockResolvedValue(newUser);

            const result = await userRepository.createUser(
                createUserRequest,
                'http://profileimage.com',
            );

            expect(prismaService.user.create).toHaveBeenCalledWith({
                data: {
                    ...createUserRequest,
                    roleId: 3,
                    isAuth: true,
                    profileImage: 'http://profileimage.com',
                    internStartDate: null,
                    internEndDate: null,
                    fullTimeStartDate: null,
                    fullTimeEndDate: null,
                },
            });

            expect(result).toEqual(newUser);
        });
    });

    describe('findOneByEmail', () => {
        it('should find a user by email', async () => {
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
                internStartDate: null,
                internEndDate: null,
                fullTimeStartDate: null,
                fullTimeEndDate: null,
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

        it('should return null if user is not found', async () => {
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
        it('should find a user by ID', async () => {
            const userId = 999;
            const user = {
                id: userId,
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
                year: 6,
                isLft: false,
                githubUrl: 'https://github.com/tester',
                blogUrl: 'https://blog.example.com',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                school: 'Hogwarts',
                class: '1학년',
                profileImage: 'https://example.com/image.png',
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
                internStartDate: null,
                internEndDate: null,
                fullTimeStartDate: null,
                fullTimeEndDate: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                teamMembers: [
                    {
                        team: {
                            name: 'Team A',
                            category: 'Study',
                        },
                    },
                ],
            };

            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(
                user,
            );

            const result = await userRepository.findById(userId);

            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: {
                    id: userId,
                    isDeleted: false,
                },
                select: {
                    id: true,
                    name: true,
                    nickname: true,
                    email: true,
                    mainPosition: true,
                    subPosition: true,
                    school: true,
                    class: true,
                    profileImage: true,
                    githubUrl: true,
                    blogUrl: true,
                    teamMembers: {
                        where: { isDeleted: false },
                        select: {
                            team: {
                                select: {
                                    name: true,
                                    category: true,
                                },
                            },
                        },
                    },
                },
            });

            expect(result).toEqual({
                id: userId,
                name: 'Test User',
                nickname: 'tester',
                email: 'test@example.com',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                school: 'Hogwarts',
                class: '1학년',
                profileImage: 'https://example.com/image.png',
                githubUrl: 'https://github.com/tester',
                blogUrl: 'https://blog.example.com',
                teams: [
                    {
                        name: 'Team A',
                        category: 'Study',
                    },
                ],
            });
        });
    });

    describe('updateUserProfile', () => {
        it('should update the user profile', async () => {
            const userId = 1;
            const updateUserRequest: UpdateUserRequest = {
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
                githubUrl: updateUserRequest.githubUrl,
                blogUrl: updateUserRequest.blogUrl,
                mainPosition: updateUserRequest.mainPosition,
                subPosition: updateUserRequest.subPosition,
                school: updateUserRequest.school,
                class: updateUserRequest.class,
                profileImage: updateUserRequest.profileImage,
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
                internStartDate: null,
                internEndDate: null,
                fullTimeStartDate: null,
                fullTimeEndDate: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prismaService.user.update as jest.Mock).mockResolvedValue(
                updatedUser,
            );

            const result = await userRepository.updateUserProfile(
                userId,
                updateUserRequest,
            );

            expect(prismaService.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { ...updateUserRequest },
            });
            expect(result).toEqual(updatedUser);
        });
    });

    describe('softDeleteUser', () => {
        it('should soft delete a user', async () => {
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
                internStartDate: null,
                internEndDate: null,
                fullTimeStartDate: null,
                fullTimeEndDate: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prismaService.user.update as jest.Mock).mockResolvedValue(
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

    describe('updateUserRole', () => {
        it('should update user role', async () => {
            const userId = 1;
            const newRoleId = 2;

            const updatedUser: UserEntity = {
                id: userId,
                email: 'test@test.com',
                password: 'password123',
                name: 'test',
                year: 6,
                isDeleted: false,
                isAuth: true,
                nickname: 'tester',
                roleId: newRoleId,
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
                internStartDate: null,
                internEndDate: null,
                fullTimeStartDate: null,
                fullTimeEndDate: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prismaService.user.update as jest.Mock).mockResolvedValue(
                updatedUser,
            );

            const result = await userRepository.updateUserRole(
                userId,
                newRoleId,
            );

            expect(prismaService.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { roleId: newRoleId },
            });
            expect(result).toEqual(updatedUser);
        });
    });

    describe('updatePermissionRequestStatus', () => {
        it('should update permission request status', async () => {
            const userId = 1;
            const status = 'APPROVED';

            (
                prismaService.permissionRequest.updateMany as jest.Mock
            ).mockResolvedValue({ count: 1 });

            const result = await userRepository.updatePermissionRequestStatus(
                userId,
                status,
            );

            expect(
                prismaService.permissionRequest.updateMany,
            ).toHaveBeenCalledWith({
                where: {
                    userId,
                    status: 'PENDING',
                },
                data: {
                    status,
                },
            });

            expect(result).toEqual({ count: 1 });
        });
    });

    describe('createPermissionRequest', () => {
        it('should create a permission request', async () => {
            const userId = 1;
            const roleId = 2;

            (
                prismaService.permissionRequest.create as jest.Mock
            ).mockResolvedValue({
                userId,
                requestedRoleId: roleId,
                status: 'PENDING',
            });

            const result = await userRepository.createPermissionRequest(
                userId,
                roleId,
            );

            expect(prismaService.permissionRequest.create).toHaveBeenCalledWith(
                {
                    data: {
                        userId,
                        requestedRoleId: roleId,
                        status: 'PENDING',
                    },
                },
            );

            expect(result).toEqual({
                userId,
                requestedRoleId: roleId,
                status: 'PENDING',
            });
        });
    });

    describe('getAllPermissionRequests', () => {
        it('should return all permission requests', async () => {
            const requests = [
                {
                    userId: 1,
                    requestedRoleId: 2,
                    status: 'PENDING',
                },
            ];

            (
                prismaService.permissionRequest.findMany as jest.Mock
            ).mockResolvedValue(requests);

            const result = await userRepository.getAllPermissionRequests();

            expect(
                prismaService.permissionRequest.findMany,
            ).toHaveBeenCalledWith({
                where: { status: 'PENDING' },
                include: { user: true },
            });

            expect(result).toEqual(requests);
        });
    });

    describe('updateProfileImageByEmail', () => {
        it('should update the profile image by email', async () => {
            const email = 'test@test.com';
            const imageUrl = 'https://newprofileimage.com';

            const updatedUser = {
                id: 1,
                email,
                profileImage: imageUrl,
            };

            (prismaService.user.update as jest.Mock).mockResolvedValue(
                updatedUser,
            );

            const result = await userRepository.updateProfileImageByEmail(
                email,
                imageUrl,
            );

            expect(prismaService.user.update).toHaveBeenCalledWith({
                where: { email },
                data: { profileImage: imageUrl },
            });
            expect(result).toEqual(updatedUser);
        });
    });

    describe('updateNickname', () => {
        it('should update the nickname of the user', async () => {
            const userId = 1;
            const nickname = 'newNickname';

            const updatedUser = {
                id: userId,
                nickname,
            };

            (prismaService.user.update as jest.Mock).mockResolvedValue(
                updatedUser,
            );

            const result = await userRepository.updateNickname(
                userId,
                nickname,
            );

            expect(prismaService.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { nickname },
            });
            expect(result).toEqual(updatedUser);
        });
    });

    describe('findAllProfiles', () => {
        it('should return all profiles matching the query', async () => {
            const query: GetUserssQueryRequest = {
                position: 'Backend',
                year: 6,
                university: 'Hogwarts',
                grade: '1학년',
                offset: 0,
                limit: 10,
            };

            const profiles = [
                {
                    id: 1,
                    name: 'Test User',
                    email: 'test@test.com',
                    mainPosition: 'Backend',
                    school: 'Hogwarts',
                    class: '1학년',
                    nickname: 'tester',
                    profileImage: 'http://profileimage.com',
                    githubUrl: 'https://github.com/test',
                    blogUrl: 'https://example.com/blog',
                    subPosition: 'Frontend',
                    teamMembers: [
                        {
                            team: {
                                name: 'Team A',
                                category: 'Study',
                            },
                        },
                    ],
                },
            ];

            const expectedProfiles = profiles.map((profile) => ({
                ...profile,
                teams: profile.teamMembers.map((teamMember) => teamMember.team),
            }));

            (prismaService.user.findMany as jest.Mock).mockResolvedValue(
                profiles,
            );

            const result = await userRepository.findAllProfiles(query);

            expect(prismaService.user.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    mainPosition: query.position,
                    school: query.university,
                    class: query.grade,
                    year: query.year,
                },
                skip: query.offset || 0,
                take: query.limit || 10,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    mainPosition: true,
                    school: true,
                    class: true,
                    nickname: true,
                    profileImage: true,
                    subPosition: true,
                    teamMembers: {
                        where: { isDeleted: false },
                        select: {
                            team: {
                                select: {
                                    name: true,
                                    category: true,
                                },
                            },
                        },
                    },
                },
            });

            expect(result).toEqual(expectedProfiles);
        });
    });
});
