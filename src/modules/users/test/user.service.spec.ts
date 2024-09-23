import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { UserRepository } from '../repository/user.repository';
import { ResumeRepository } from '../../resumes/repository/resume.repository';
import { UserEntity } from '../entities/user.entity';
import { CreateUserDTO } from '../dto/request/create.user.request';
import { CreateResumeDTO } from '../../resumes/dto/request/create.resume.request';
import { ResumeType } from '../../../global/common/enums/ResumeType';
import { AuthService } from '../../../auth/auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('UserService', () => {
    let service: UserService;
    let userRepository: UserRepository;
    let resumeRepository: ResumeRepository;
    let authService: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: UserRepository,
                    useValue: {
                        findUserByEmail: jest.fn(),
                        createUser: jest.fn(),
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
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        userRepository = module.get<UserRepository>(UserRepository);
        resumeRepository = module.get<ResumeRepository>(ResumeRepository);
        authService = module.get<AuthService>(AuthService);
    });

    it('정의되어 있어야 한다', () => {
        expect(service).toBeDefined();
        expect(userRepository).toBeDefined();
        expect(resumeRepository).toBeDefined();
        expect(authService).toBeDefined();
    });

    describe('signUp', () => {
        it('이메일 인증이 완료되면 유저를 생성해야 한다', async () => {
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

            const createResumeDTO: CreateResumeDTO = {
                title: 'Test Resume',
                url: 'https://resume.com/test.pdf',
                ResumeType: ResumeType.PORTFOLIO,
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
                roleId: 1,
                isAuth: true,
                year: createUserDTO.year,
            };

            jest.spyOn(authService, 'checkIfVerified').mockResolvedValue(true);
            jest.spyOn(userRepository, 'createUser').mockResolvedValue(newUser);
            jest.spyOn(resumeRepository, 'createResume').mockResolvedValue(
                null,
            );

            const result = await service.signUp(createUserDTO, createResumeDTO);

            expect(authService.checkIfVerified).toHaveBeenCalledWith(
                createUserDTO.email,
            );
            expect(userRepository.createUser).toHaveBeenCalledWith(
                createUserDTO,
                expect.any(Function),
            );
            expect(result).toEqual(newUser);
        });

        it('이메일 인증이 완료되지 않으면 UnauthorizedException을 던져야 한다', async () => {
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

            jest.spyOn(authService, 'checkIfVerified').mockResolvedValue(false);

            await expect(service.signUp(createUserDTO)).rejects.toThrow(
                UnauthorizedException,
            );
            expect(authService.checkIfVerified).toHaveBeenCalledWith(
                createUserDTO.email,
            );
            expect(userRepository.createUser).not.toHaveBeenCalled();
        });
    });
});
