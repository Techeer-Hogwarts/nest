import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { UserRepository } from '../repository/user.repository';
import { ResumeRepository } from '../../resumes/repository/resume.repository';
import { UserEntity } from '../entities/user.entity';
import { CreateUserDTO } from '../dto/request/create.user.request';
import { CreateResumeDTO } from '../../resumes/dto/request/create.resume.request';
import { ResumeType } from '../../../global/common/enums/ResumeType';
import { ResumeEntity } from '../../resumes/entities/resume.entity';

describe('UserService', () => {
    let service: UserService;
    let userRepository: UserRepository;
    let resumeRepository: ResumeRepository;

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
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        userRepository = module.get<UserRepository>(UserRepository);
        resumeRepository = module.get<ResumeRepository>(ResumeRepository);
    });

    it('정의되어 있어야 한다', () => {
        expect(service).toBeDefined();
        expect(userRepository).toBeDefined();
        expect(resumeRepository).toBeDefined();
    });

    describe('findUserByEmail', () => {
        it('이메일로 사용자를 찾아야 한다', async () => {
            const email = 'test@test.com';
            const user: UserEntity = {
                id: 1,
                email,
                name: 'Test User',
                password: 'password',
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

            jest.spyOn(userRepository, 'findUserByEmail').mockResolvedValue(
                user,
            );

            const result = await service.findUserByEmail(email);
            expect(result).toEqual(user);
            expect(userRepository.findUserByEmail).toHaveBeenCalledWith(email);
        });
    });

    describe('createUser', () => {
        it('유저 생성 후 이력서가 존재하면 이력서를 생성해야 한다', async () => {
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

            const newResume: ResumeEntity = {
                id: 1,
                title: createResumeDTO.title,
                url: createResumeDTO.url,
                ResumeType: ResumeType.PORTFOLIO,
                userId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                isMain: false,
                likeCount: 0,
                viewCount: 0,
                user: newUser,
            };

            jest.spyOn(userRepository, 'createUser').mockImplementation(
                async (
                    dto: CreateUserDTO,
                    callback: (newUser: UserEntity) => Promise<void>,
                ) => {
                    await callback(newUser);
                    return newUser;
                },
            );

            jest.spyOn(resumeRepository, 'createResume').mockResolvedValue(
                newResume,
            );

            const result = await service.createUser(
                createUserDTO,
                createResumeDTO,
            );

            expect(result).toEqual(newUser);
            expect(userRepository.createUser).toHaveBeenCalledWith(
                createUserDTO,
                expect.any(Function),
            );
            expect(resumeRepository.createResume).toHaveBeenCalledWith(
                createResumeDTO,
                newUser.id,
            );
        });

        it('유저 생성 후 이력서가 없으면 이력서를 생성하지 않아야 한다', async () => {
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
                roleId: 1,
                isAuth: true,
                year: createUserDTO.year,
            };

            jest.spyOn(userRepository, 'createUser').mockImplementation(
                async (
                    dto: CreateUserDTO,
                    callback: (newUser: UserEntity) => Promise<void>,
                ) => {
                    await callback(newUser);
                    return newUser;
                },
            );

            const result = await service.createUser(createUserDTO);

            expect(result).toEqual(newUser);
            expect(userRepository.createUser).toHaveBeenCalledWith(
                createUserDTO,
                expect.any(Function),
            );
            expect(resumeRepository.createResume).not.toHaveBeenCalled();
        });
    });
});
