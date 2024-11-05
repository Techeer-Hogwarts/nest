import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { UserRepository } from '../repository/user.repository';
import { ResumeRepository } from '../../resumes/repository/resume.repository';
import { AuthService } from '../../../auth/auth.service';
import { HttpService } from '@nestjs/axios';
import { CreateUserRequest } from '../dto/request/create.user.request';
import { CreateResumeRequest } from '../../resumes/dto/request/create.resume.request';
import { UpdateUserRequest } from '../dto/request/update.user.request';
import { GetUserssQueryRequest } from '../dto/request/get.user.query.request';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { of } from 'rxjs';
import { User } from '@prisma/client';
import { ResumeEntity } from '../../resumes/entities/resume.entity';
import { AxiosHeaders, AxiosResponse } from 'axios';

describe('UserService', () => {
    let userService: UserService;
    let userRepository: UserRepository;
    let resumeRepository: ResumeRepository;
    let authService: AuthService;
    let httpService: HttpService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: UserRepository,
                    useValue: {
                        createUser: jest.fn(),
                        findById: jest.fn(),
                        updateUserProfile: jest.fn(),
                        softDeleteUser: jest.fn(),
                        createPermissionRequest: jest.fn(),
                        getAllPermissionRequests: jest.fn(),
                        updateUserRole: jest.fn(),
                        updatePermissionRequestStatus: jest.fn(),
                        updateProfileImageByEmail: jest.fn(),
                        updateNickname: jest.fn(),
                        findAllProfiles: jest.fn(),
                    },
                },
                {
                    provide: ResumeRepository,
                    useValue: {
                        createResume: jest.fn(),
                    },
                },
                {
                    provide: AuthService,
                    useValue: {
                        checkIfVerified: jest.fn(),
                    },
                },
                {
                    provide: HttpService,
                    useValue: {
                        post: jest.fn(),
                    } as any,
                },
            ],
        }).compile();

        userService = module.get<UserService>(UserService);
        userRepository = module.get<UserRepository>(UserRepository);
        resumeRepository = module.get<ResumeRepository>(ResumeRepository);
        authService = module.get<AuthService>(AuthService);
        httpService = module.get<HttpService>(HttpService);
    });

    it('should be defined', () => {
        expect(userService).toBeDefined();
    });

    describe('signUp', () => {
        it('should create a user and resume', async () => {
            const createUserRequest: CreateUserRequest = {
                email: 'test@test.com',
                password: 'password123',
                name: 'Test',
                year: 2023,
                isLft: false,
                githubUrl: 'https://github.com/test',
                blogUrl: 'https://blog.com',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                school: 'Hogwarts',
                class: '1학년',
            };

            const createResumeRequest: CreateResumeRequest = {
                title: 'My Resume',
                url: 'https://resume.com',
                category: 'PORTFOLIO',
            };

            const user = {
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
            } as User;

            jest.spyOn(authService, 'checkIfVerified').mockResolvedValue(true);
            jest.spyOn(userRepository, 'createUser').mockResolvedValue(user);
            jest.spyOn(resumeRepository, 'createResume').mockResolvedValue({
                id: 1,
                title: 'Resume Title',
                url: 'https://example.com',
                category: 'PORTFOLIO',
            } as ResumeEntity);

            const mockHeaders = new AxiosHeaders({
                'Content-Type': 'application/json',
            });

            const mockImageUrlResponse: AxiosResponse<{
                image: string;
                isTecheer: boolean;
            }> = {
                data: {
                    image: 'https://newprofileimage.com',
                    isTecheer: true,
                },
                status: 200,
                statusText: 'OK',
                headers: {
                    'Content-Type': 'application/json',
                },
                config: {
                    url: 'https://example.com/api',
                    method: 'post', // HTTP method
                    headers: mockHeaders,
                    data: {
                        email: 'test@test.com',
                    },
                },
            };

            jest.spyOn(httpService, 'post').mockReturnValue(
                of(mockImageUrlResponse),
            );

            const result = await userService.signUp(
                createUserRequest,
                createResumeRequest,
            );

            expect(authService.checkIfVerified).toHaveBeenCalledWith(
                createUserRequest.email,
            );
            expect(userRepository.createUser).toHaveBeenCalled();
            expect(resumeRepository.createResume).toHaveBeenCalledWith(
                createResumeRequest,
                user.id,
            );
            expect(result).toEqual(user);
        });
    });

    describe('findById', () => {
        it('should return user if found by id', async () => {
            const user = {
                id: 1,
                email: 'test@test.com',
            } as User;
            jest.spyOn(userRepository, 'findById').mockResolvedValue(user);

            const result = await userService.findById(1);

            expect(userRepository.findById).toHaveBeenCalledWith(1);
            expect(result).toEqual(user);
        });

        it('should throw NotFoundException if user is not found', async () => {
            jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

            await expect(userService.findById(1)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('updateUserProfile', () => {
        it('should update the user profile', async () => {
            const userId = 1;
            const updateUserRequest: UpdateUserRequest = {
                profileImage: 'https://newimage.com',
                school: 'New School',
                class: '2학년',
                mainPosition: 'Backend',
                githubUrl: 'https://github.com/newuser',
                blogUrl: 'https://newblog.com',
                isLft: false,
                isIntern: false,
                internCompanyName: 'Company',
                internPosition: 'Developer',
                isFullTime: true,
                fullTimeCompanyName: 'NewCompany',
                fullTimePosition: 'Developer',
            };

            const user = {
                id: 1,
                email: 'test@test.com',
            } as User;

            jest.spyOn(userRepository, 'findById').mockResolvedValue(user);
            jest.spyOn(userRepository, 'updateUserProfile').mockResolvedValue(
                user,
            );

            const result = await userService.updateUserProfile(
                userId,
                updateUserRequest,
            );

            expect(userRepository.findById).toHaveBeenCalledWith(userId);
            expect(userRepository.updateUserProfile).toHaveBeenCalledWith(
                userId,
                updateUserRequest,
            );
            expect(result).toEqual(user);
        });

        it('should throw NotFoundException if user is not found', async () => {
            jest.spyOn(userRepository, 'findById').mockResolvedValue(null);
            const updateUserRequest: UpdateUserRequest = {
                profileImage: 'https://newimage.com',
                school: 'New School',
                class: '2학년',
                mainPosition: 'Backend',
                githubUrl: 'https://github.com/newuser',
                blogUrl: 'https://newblog.com',
                isLft: false,
                isIntern: false,
                internCompanyName: 'Company',
                internPosition: 'Developer',
                isFullTime: true,
                fullTimeCompanyName: 'NewCompany',
                fullTimePosition: 'Developer',
            };

            await expect(
                userService.updateUserProfile(1, updateUserRequest),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('deleteUser', () => {
        it('should soft delete a user', async () => {
            const user = {
                id: 1,
                email: 'test@test.com',
            } as User;
            jest.spyOn(userRepository, 'findById').mockResolvedValue(user);
            jest.spyOn(userRepository, 'softDeleteUser').mockResolvedValue(
                user,
            );

            const result = await userService.deleteUser(1);

            expect(userRepository.findById).toHaveBeenCalledWith(1);
            expect(userRepository.softDeleteUser).toHaveBeenCalledWith(1);
            expect(result).toEqual(user);
        });

        it('should throw NotFoundException if user is not found', async () => {
            jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

            await expect(userService.deleteUser(1)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('getAllProfiles', () => {
        it('should return all profiles matching query', async () => {
            const query: GetUserssQueryRequest = {
                position: 'Backend',
                year: 2023,
                university: 'Hogwarts',
                grade: '1학년',
                offset: 0,
                limit: 10,
            };

            const profiles = [
                {
                    id: 1,
                    email: 'test@test.com',
                },
            ];
            jest.spyOn(userRepository, 'findAllProfiles').mockResolvedValue(
                profiles,
            );

            const result = await userService.getAllProfiles(query);

            expect(userRepository.findAllProfiles).toHaveBeenCalledWith(query);
            expect(result).toEqual(profiles);
        });
    });

    describe('updateNickname', () => {
        it('should update nickname if user has the right role', async () => {
            const user = {
                id: 1,
                roleId: 1,
            } as User;
            const nickname = 'NewNickname';
            const updatedUser = {
                ...user,
                nickname,
            };

            jest.spyOn(userRepository, 'updateNickname').mockResolvedValue(
                updatedUser,
            );

            const result = await userService.updateNickname(user, nickname);

            expect(userRepository.updateNickname).toHaveBeenCalledWith(
                user.id,
                nickname,
            );
            expect(result).toEqual(updatedUser);
        });

        it('should throw UnauthorizedException if user has no permission', async () => {
            const user = {
                id: 1,
                roleId: 3,
            } as User;
            const nickname = 'NewNickname';

            await expect(
                userService.updateNickname(user, nickname),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('updateProfileImage', () => {
        it('should update profile image if user is techeer', async () => {
            const request = {
                user: { email: 'test@test.com' },
            };

            const mockHeaders = new AxiosHeaders({
                'Content-Type': 'application/json',
            });

            const image = 'https://newimage.com';

            const mockAxiosResponse: AxiosResponse = {
                data: {
                    image: image,
                    isTecheer: true,
                },
                status: 200,
                statusText: 'OK',
                headers: {
                    'Content-Type': 'application/json',
                },
                config: {
                    url: 'https://example.com/api',
                    method: 'post',
                    headers: mockHeaders,
                    data: {
                        email: request.user.email,
                    },
                },
            };

            jest.spyOn(httpService, 'post').mockReturnValue(
                of(mockAxiosResponse),
            );

            jest.spyOn(
                userRepository,
                'updateProfileImageByEmail',
            ).mockResolvedValue({});

            const result = await userService.updateProfileImage(request);

            expect(
                userRepository.updateProfileImageByEmail,
            ).toHaveBeenCalledWith('test@test.com', image);
            expect(result.data.image).toEqual(image);
        });
    });
});
