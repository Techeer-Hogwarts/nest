import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { AuthService } from '../../../auth/auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { CreateUserDTO } from '../dto/request/create.user.request';
import { CreateResumeDTO } from '../../resumes/dto/request/create.resume.request';
import { UserEntity } from '../entities/user.entity';
import { ResumeType } from '../../../global/common/enums/ResumeType';

describe('UserController', () => {
    let userController: UserController;
    let userService: UserService;
    let authService: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                {
                    provide: UserService,
                    useValue: {
                        createUser: jest.fn(),
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

        userController = module.get<UserController>(UserController);
        userService = module.get<UserService>(UserService);
        authService = module.get<AuthService>(AuthService);
    });

    it('정의되어 있어야 한다', () => {
        expect(userController).toBeDefined();
    });

    describe('signUp', () => {
        it('이메일 인증이 완료되면 유저를 생성해야 한다', async () => {
            const createUserDTO: CreateUserDTO = {
                email: 'test@test.com',
                password: 'password123',
                name: 'test',
                year: 6,
                isLft: false,
                githubUrl: 'github.com/test',
                blogUrl: 'blog.com/test',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                school: 'School',
                class: '휴학중',
            };

            const createResumeDTO: CreateResumeDTO = {
                title: 'My Resume',
                url: 'https://example.com/resume.pdf',
                ResumeType: ResumeType.PORTFOLIO,
            };

            const userEntity: UserEntity = {
                id: 1,
                email: createUserDTO.email,
                name: createUserDTO.name,
                password: createUserDTO.password,
                year: createUserDTO.year,
                isLft: createUserDTO.isLft,
                githubUrl: createUserDTO.githubUrl,
                blogUrl: createUserDTO.blogUrl,
                mainPosition: createUserDTO.mainPosition,
                subPosition: createUserDTO.subPosition,
                school: createUserDTO.school,
                class: createUserDTO.class,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                roleId: 1,
                isAuth: true,
            };

            jest.spyOn(authService, 'checkIfVerified').mockResolvedValue(true);
            jest.spyOn(userService, 'createUser').mockResolvedValue(userEntity);

            const result = await userController.signUp(
                createUserDTO,
                createResumeDTO,
            );

            expect(authService.checkIfVerified).toHaveBeenCalledWith(
                createUserDTO.email,
            );
            expect(userService.createUser).toHaveBeenCalledWith(
                createUserDTO,
                createResumeDTO,
            );
            expect(result).toEqual(userEntity);
        });

        it('이메일 인증이 안되면 UnauthorizedException을 던져야 한다', async () => {
            const createUserDTO: CreateUserDTO = {
                email: 'test@test.com',
                password: 'password123',
                name: 'test',
                year: 6,
                isLft: false,
                githubUrl: 'github.com/test',
                blogUrl: 'blog.com/test',
                mainPosition: 'Backend',
                subPosition: 'Frontend',
                school: 'School',
                class: '휴학중',
            };

            jest.spyOn(authService, 'checkIfVerified').mockResolvedValue(false);

            await expect(userController.signUp(createUserDTO)).rejects.toThrow(
                UnauthorizedException,
            );
            expect(authService.checkIfVerified).toHaveBeenCalledWith(
                createUserDTO.email,
            );
            expect(userService.createUser).not.toHaveBeenCalled();
        });
    });
});
