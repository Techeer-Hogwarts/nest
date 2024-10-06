import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { UserRepository } from '../repository/user.repository';
import { ResumeRepository } from '../../resumes/repository/resume.repository';
import { AuthService } from '../../../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserRequest } from '../dto/request/create.user.request';
import { CreateResumeRequest } from '../../resumes/dto/request/create.resume.request';
import { UserEntity } from '../entities/user.entity';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('UserService', () => {
    let service: UserService;
    let userRepository: UserRepository;
    let resumeRepository: ResumeRepository;
    let authService: AuthService;
    let jwtService: JwtService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: UserRepository,
                    useValue: {
                        findOneByEmail: jest.fn(),
                        createUser: jest.fn(),
                        findById: jest.fn(),
                        updateUserProfile: jest.fn(),
                        softDeleteUser: jest.fn(),
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
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn(),
                        verify: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        userRepository = module.get<UserRepository>(UserRepository);
        resumeRepository = module.get<ResumeRepository>(ResumeRepository);
        authService = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService);
    });

    it('정의되어 있어야 한다', () => {
        expect(service).toBeDefined();
    });

    describe('signUp', () => {
        it('유저와 이력서를 생성해야 한다', async () => {
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

            const createResumeRequest: CreateResumeRequest = {
                title: 'My Resume',
                url: 'https://example.com/resume.pdf',
                ResumeType: 'PORTFOLIO',
            };

            const userEntity: UserEntity = {
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

            jest.spyOn(authService, 'checkIfVerified').mockResolvedValue(true);
            jest.spyOn(userRepository, 'createUser').mockResolvedValue(
                userEntity,
            );

            const result = await service.signUp(
                createUserRequest,
                createResumeRequest,
            );

            expect(userRepository.createUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: createUserRequest.email,
                    password: expect.any(String),
                }),
                expect.any(Function),
            );
            expect(resumeRepository.createResume).toHaveBeenCalledWith(
                createResumeRequest,
                userEntity.id,
            );
            expect(result).toEqual(userEntity);
        });

        it('이메일 인증이 완료되지 않으면 UnauthorizedException을 던져야 한다', async () => {
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

            jest.spyOn(authService, 'checkIfVerified').mockResolvedValue(false);

            await expect(service.signUp(createUserRequest)).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });

    describe('login', () => {
        it('성공적인 로그인 시 토큰을 반환해야 한다', async () => {
            const email = 'test@test.com';
            const password = 'password123';

            const user: UserEntity = {
                id: 1,
                email,
                password: await bcrypt.hash(password, 10),
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

            jest.spyOn(userRepository, 'findOneByEmail').mockResolvedValue(
                user,
            );
            jest.spyOn(jwtService, 'sign').mockReturnValue('mockAccessToken');
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

            const result = await service.login(email, password);

            expect(userRepository.findOneByEmail).toHaveBeenCalledWith(email);
            expect(jwtService.sign).toHaveBeenCalled();
            expect(result).toEqual({
                accessToken: 'mockAccessToken',
                refreshToken: 'mockAccessToken',
            });
        });

        it('비밀번호가 틀리면 UnauthorizedException을 던져야 한다', async () => {
            const email = 'test@test.com';
            const password = 'wrongPassword';

            const user: UserEntity = {
                id: 1,
                email,
                password: await bcrypt.hash('password123', 10),
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

            jest.spyOn(userRepository, 'findOneByEmail').mockResolvedValue(
                user,
            );
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

            await expect(service.login(email, password)).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });

    describe('findById', () => {
        it('ID로 사용자를 찾아야 한다', async () => {
            const user: UserEntity = {
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

            jest.spyOn(userRepository, 'findById').mockResolvedValue(user);

            const result = await service.findById(1);

            expect(userRepository.findById).toHaveBeenCalledWith(1);
            expect(result).toEqual(user);
        });

        it('사용자를 찾을 수 없으면 NotFoundException을 던져야 한다', async () => {
            jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

            await expect(service.findById(1)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('updateUserProfile', () => {
        it('사용자 프로필을 업데이트해야 한다', async () => {
            const userId = 1;
            const updateUserProfileDto = {
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

            const user: UserEntity = {
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

            jest.spyOn(userRepository, 'findById').mockResolvedValue(user);
            jest.spyOn(userRepository, 'updateUserProfile').mockResolvedValue(
                user,
            );

            const result = await service.updateUserProfile(
                userId,
                updateUserProfileDto,
            );

            expect(userRepository.findById).toHaveBeenCalledWith(userId);
            expect(userRepository.updateUserProfile).toHaveBeenCalledWith(
                userId,
                updateUserProfileDto,
            );
            expect(result).toEqual(user);
        });

        it('사용자를 찾을 수 없으면 NotFoundException을 던져야 한다', async () => {
            const updateUserProfileDto = {
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

            jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

            await expect(
                service.updateUserProfile(1, updateUserProfileDto),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('deleteUser', () => {
        it('유저를 소프트 삭제해야 한다', async () => {
            const user: UserEntity = {
                id: 1,
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

            jest.spyOn(userRepository, 'findById').mockResolvedValue(user);
            jest.spyOn(userRepository, 'softDeleteUser').mockResolvedValue(
                user,
            );

            const result = await service.deleteUser(1);

            expect(userRepository.findById).toHaveBeenCalledWith(1);
            expect(userRepository.softDeleteUser).toHaveBeenCalledWith(1);
            expect(result).toEqual(user);
        });

        it('사용자를 찾을 수 없으면 NotFoundException을 던져야 한다', async () => {
            jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

            await expect(service.deleteUser(1)).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
