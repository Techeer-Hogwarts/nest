import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { UserRepository } from '../repository/user.repository';
import { AuthService } from '../../../auth/auth.service';
import { HttpService } from '@nestjs/axios';
import { CreateUserRequest } from '../dto/request/create.user.request';
import { CreateResumeRequest } from '../../resumes/dto/request/create.resume.request';
import { UpdateUserRequest } from '../dto/request/update.user.request';
import { GetUserssQueryRequest } from '../dto/request/get.user.query.request';
import { of } from 'rxjs';
import { User } from '@prisma/client';
import { ResumeEntity } from '../../resumes/entities/resume.entity';
import { AxiosHeaders, AxiosResponse } from 'axios';
import {
    UnauthorizedAdminException,
    NotFoundUserException,
} from '../../../global/exception/custom.exception';
import { TaskService } from '../../../global/task/task.service';
import { ResumeService } from '../../resumes/resume.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('UserService', () => {
    let userService: UserService;
    let userRepository: UserRepository;
    let resumeService: ResumeService;
    let authService: AuthService;
    let httpService: HttpService;
    let taskService: TaskService;
    let prismaService: PrismaService;

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
                    provide: ResumeService,
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
                {
                    provide: TaskService,
                    useValue: {
                        requestSignUpBlogFetch: jest.fn(),
                    } as any,
                },
                {
                    provide: PrismaService,
                    useValue: {},
                },
            ],
        }).compile();

        userService = module.get<UserService>(UserService);
        userRepository = module.get<UserRepository>(UserRepository);
        resumeService = module.get<ResumeService>(ResumeService);
        authService = module.get<AuthService>(AuthService);
        httpService = module.get<HttpService>(HttpService);
        taskService = module.get<TaskService>(TaskService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(userService).toBeDefined();
    });

    describe('signUp', () => {
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
            isFullTime: false,
        };

        const createResumeRequest: CreateResumeRequest = {
            title: 'My Resume',
            url: 'https://resume.com',
            position: 'Backend',
            category: 'PORTFOLIO',
            isMain: true,
        };

        const mockUser: User = {
            id: 1,
            email: 'test@test.com',
            password: 'hashedPassword',
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
            internCompanyName: null,
            internPosition: null,
            isFullTime: false,
            fullTimeCompanyName: null,
            fullTimePosition: null,
            internStartDate: null,
            internEndDate: null,
            fullTimeStartDate: null,
            fullTimeEndDate: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const mockResumeEntity: ResumeEntity = {
            id: 1,
            title: 'Resume Title',
            url: 'https://example.com',
            category: 'PORTFOLIO',
            isMain: true,
            position: 'Backend',
            userId: 1,
            user: mockUser, // 누락된 필드 추가
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false,
            likeCount: 0,
            viewCount: 2,
        };

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
                headers: new AxiosHeaders({
                    'Content-Type': 'application/json',
                }),
            },
        };

        beforeEach(() => {
            jest.spyOn(authService, 'checkIfVerified').mockResolvedValue(true);
            jest.spyOn(httpService, 'post').mockReturnValue(
                of(mockImageUrlResponse),
            );
            jest.spyOn(userRepository, 'createUser').mockResolvedValue(
                mockUser,
            );
            jest.spyOn(resumeService, 'createResume').mockResolvedValue(
                mockResumeEntity,
            );
            jest.spyOn(
                taskService,
                'requestSignUpBlogFetch',
            ).mockResolvedValue();

            // Prisma $transaction 모의
            prismaService.$transaction = jest.fn(async (callback: any) => {
                return await callback(prismaService);
            }) as unknown as PrismaService['$transaction'];
        });

        it('should create a user and resume successfully', async () => {
            const mockFile: Express.Multer.File = {
                fieldname: 'file',
                originalname: 'resume.pdf',
                encoding: '7bit',
                mimetype: 'application/pdf',
                buffer: Buffer.from('mock file content'),
                size: 1024,
                stream: null,
                destination: '',
                filename: '',
                path: '',
            };

            const result = await userService.signUp(
                createUserRequest,
                mockFile,
                createResumeRequest,
            );

            // 이메일 인증 확인
            expect(authService.checkIfVerified).toHaveBeenCalledWith(
                createUserRequest.email,
            );

            // 사용자 생성 호출 확인
            expect(userRepository.createUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: createUserRequest.email,
                    name: createUserRequest.name,
                }),
                expect.any(String), // 프로필 이미지 URL
                expect.anything(), // Prisma 트랜잭션
            );

            // 이력서 생성 호출 확인
            expect(resumeService.createResume).toHaveBeenCalledWith(
                createResumeRequest,
                mockFile,
                mockUser,
                expect.anything(), // Prisma 트랜잭션
            );

            // 블로그 크롤링 요청 호출 확인
            expect(taskService.requestSignUpBlogFetch).toHaveBeenCalledWith(
                mockUser.id,
                createUserRequest.blogUrl,
            );

            // 최종 결과 검증
            expect(result).toEqual(mockUser);
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
            ).rejects.toThrow(NotFoundUserException);
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
                NotFoundUserException,
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
            ).rejects.toThrow(UnauthorizedAdminException);
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
