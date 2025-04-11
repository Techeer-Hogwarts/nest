// import { Test, TestingModule } from '@nestjs/testing';
// import { HttpService } from '@nestjs/axios';
// import { CustomWinstonLogger } from '../../../global/logger/winston.logger';
// import { of } from 'rxjs';
// import {
//     NotFoundUserException,
//     NotVerifiedEmailException,
// } from '../../../global/exception/custom.exception';
// import { AuthService } from '../../auth/auth.service';
// import { UserExperienceRepository } from '../../../modules/userExperiences/repository/userExperience.repository';
// import { PrismaService } from '../../prisma/prisma.service';
// import { UserService } from '../user.service';
// import { CreateUserRequest } from '../dto/request/create.user.request';
// import { ResumeService } from '../../../modules/resumes/resume.service';
// import { UserRepository } from '../repository/user.repository';
// import { User } from '@prisma/client';
// import { GetUserResponse } from '../dto/response/get.user.response';
// import { TaskService } from '../../../global/task/task.service';

// describe('UserService', () => {
//     let userService: UserService;
//     let userRepository: UserRepository;
//     let authService: AuthService;
//     let httpService: HttpService;
//     let prisma: PrismaService;
//     let logger: CustomWinstonLogger;

//     beforeEach(async () => {
//         const module: TestingModule = await Test.createTestingModule({
//             providers: [
//                 UserService,
//                 {
//                     provide: UserRepository,
//                     useValue: {
//                         createUser: jest.fn(),
//                         findById: jest.fn(),
//                         softDeleteUser: jest.fn(),
//                         updateProfileImageByEmail: jest.fn(),
//                         updateNickname: jest.fn(),
//                         findAllProfiles: jest.fn(),
//                         createPermissionRequest: jest.fn(),
//                         getAllPermissionRequests: jest.fn(),
//                         updateUserRole: jest.fn(),
//                         updatePermissionRequestStatus: jest.fn(),
//                         updateUserProfile: jest.fn(),
//                     },
//                 },
//                 {
//                     provide: ResumeService,
//                     useValue: {
//                         createResume: jest.fn(),
//                     },
//                 },
//                 {
//                     provide: AuthService,
//                     useValue: {
//                         checkIfVerified: jest.fn(),
//                     },
//                 },
//                 {
//                     provide: HttpService,
//                     useValue: {
//                         post: jest.fn(),
//                     },
//                 },
//                 {
//                     provide: PrismaService,
//                     useValue: {
//                         $transaction: jest.fn(),
//                     },
//                 },
//                 {
//                     provide: UserExperienceRepository,
//                     useValue: {
//                         createUserExperience: jest.fn(),
//                         updateUserExperience: jest.fn(),
//                     },
//                 },
//                 {
//                     provide: CustomWinstonLogger,
//                     useValue: {
//                         debug: jest.fn(),
//                         error: jest.fn(),
//                     },
//                 },
//                 {
//                     provide: TaskService,
//                     useValue: {},
//                 },
//             ],
//         }).compile();

//         userService = module.get<UserService>(UserService);
//         userRepository = module.get<UserRepository>(UserRepository);
//         authService = module.get<AuthService>(AuthService);
//         httpService = module.get<HttpService>(HttpService);
//         prisma = module.get<PrismaService>(PrismaService);
//         logger = module.get<CustomWinstonLogger>(CustomWinstonLogger);
//     });

//     describe('signUp', () => {
//         it('should throw NotVerifiedEmailException if email is not verified', async () => {
//             jest.spyOn(authService, 'checkIfVerified').mockResolvedValue(false);

//             const createUserRequest = {
//                 email: 'test@test.com',
//                 password: 'password123',
//                 mainPosition: 'Backend',
//             } as CreateUserRequest;

//             await expect(userService.signUp(createUserRequest)).rejects.toThrow(
//                 NotVerifiedEmailException,
//             );

//             expect(logger.error).toHaveBeenCalledWith('이메일 인증 실패', {
//                 context: 'UserService',
//             });
//         });

//         it('should create a user successfully', async () => {
//             jest.spyOn(authService, 'checkIfVerified').mockResolvedValue(true);
//             jest.spyOn(userRepository, 'createUser').mockResolvedValue({
//                 id: 1,
//                 email: 'test@test.com',
//             } as any);

//             jest.spyOn(httpService, 'post').mockReturnValue(
//                 of({
//                     status: 200,
//                     data: {
//                         image: 'http://image.com',
//                         isTecheer: true,
//                     },
//                 }) as any,
//             );

//             jest.spyOn(prisma, '$transaction').mockImplementation(async (cb) =>
//                 cb(prisma),
//             );

//             const createUserRequest = {
//                 email: 'test@test.com',
//                 password: 'password123',
//                 mainPosition: 'Backend',
//                 grade: 'Junior',
//                 name: 'Test User',
//             } as CreateUserRequest;

//             const result = await userService.signUp(createUserRequest);

//             expect(authService.checkIfVerified).toHaveBeenCalledWith(
//                 'test@test.com',
//             );
//             expect(result).toEqual({
//                 id: 1,
//                 email: 'test@test.com',
//             });
//         });
//     });

//     describe('updateUserProfile', () => {
//         it('should throw NotFoundUserException if user does not exist', async () => {
//             jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

//             await expect(userService.updateUserProfile(1)).rejects.toThrow(
//                 NotFoundUserException,
//             );

//             expect(logger.debug).toHaveBeenCalledWith(
//                 '사용자 없음',
//                 JSON.stringify({
//                     context: 'UserService',
//                 }),
//             );
//         });

//         it('should update user profile successfully', async () => {
//             const mockUser: User = {
//                 id: 1,
//                 email: 'test@test.com',
//                 password: 'hashedPassword',
//                 name: 'test',
//                 year: 6,
//                 isLft: false,
//                 githubUrl: 'https://github.com/test',
//                 velogUrl: 'https://example.com/blog',
//                 mediumUrl: 'https://example.com/blog',
//                 tistoryUrl: 'https://example.com/blog',
//                 mainPosition: 'Backend',
//                 subPosition: 'Frontend',
//                 school: 'Hogwarts',
//                 grade: '1학년',
//                 profileImage: 'http://profileimage.com',
//                 isDeleted: false,
//                 roleId: 1,
//                 isAuth: true,
//                 nickname: 'tester',
//                 stack: ['JavaScript', 'NestJS'],
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//             };

//             jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
//             jest.spyOn(prisma, '$transaction').mockImplementation(async (cb) =>
//                 cb(prisma),
//             );
//             jest.spyOn(userRepository, 'updateUserProfile').mockResolvedValue({
//                 ...mockUser,
//                 name: 'Updated User',
//             });

//             const result = await userService.updateUserProfile(1, {
//                 school: 'New School',
//                 grade: '2학년',
//                 mainPosition: 'Backend',
//                 githubUrl: 'https://github.com/newuser',
//                 velogUrl: 'https://newblog.com',
//                 mediumUrl: 'https://newblog.com',
//                 tistoryUrl: 'https://newblog.com',
//                 isLft: false,
//             });

//             expect(result.name).toEqual('Updated User');
//             expect(userRepository.updateUserProfile).toHaveBeenCalledWith(
//                 1,
//                 expect.objectContaining({
//                     school: 'New School',
//                     grade: '2학년',
//                 }),
//                 prisma,
//             );
//         });
//     });

//     describe('deleteUser', () => {
//         it('should throw NotFoundUserException if user does not exist', async () => {
//             jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

//             await expect(userService.deleteUser(1)).rejects.toThrow(
//                 NotFoundUserException,
//             );

//             expect(logger.debug).toHaveBeenCalledWith(
//                 '사용자 없음',
//                 JSON.stringify({
//                     context: 'UserService',
//                 }),
//             );
//         });

//         it('should soft delete user successfully', async () => {
//             const mockUser: User = {
//                 id: 1,
//                 email: 'test@test.com',
//                 password: 'hashedPassword',
//                 name: 'test',
//                 year: 6,
//                 isLft: false,
//                 githubUrl: 'https://github.com/test',
//                 velogUrl: 'https://example.com/blog',
//                 mediumUrl: 'https://example.com/blog',
//                 tistoryUrl: 'https://example.com/blog',
//                 mainPosition: 'Backend',
//                 subPosition: 'Frontend',
//                 school: 'Hogwarts',
//                 grade: '1학년',
//                 profileImage: 'http://profileimage.com',
//                 isDeleted: false,
//                 roleId: 1,
//                 isAuth: true,
//                 nickname: 'tester',
//                 stack: ['JavaScript', 'NestJS'],
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//             };
//             jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
//             jest.spyOn(userRepository, 'softDeleteUser').mockResolvedValue({
//                 ...mockUser,
//                 isDeleted: true,
//             });

//             const result = await userService.deleteUser(1);

//             expect(result.isDeleted).toBe(true);
//         });
//     });

//     describe('getUserInfo', () => {
//         it('should return user info successfully', async () => {
//             const mockUser: User = {
//                 id: 1,
//                 email: 'test@test.com',
//                 password: 'hashedPassword',
//                 name: 'test',
//                 year: 6,
//                 isLft: false,
//                 githubUrl: 'https://github.com/test',
//                 velogUrl: 'https://example.com/blog',
//                 mediumUrl: 'https://example.com/blog',
//                 tistoryUrl: 'https://example.com/blog',
//                 mainPosition: 'Backend',
//                 subPosition: 'Frontend',
//                 school: 'Hogwarts',
//                 grade: '1학년',
//                 profileImage: 'http://profileimage.com',
//                 isDeleted: false,
//                 roleId: 1,
//                 isAuth: true,
//                 nickname: 'tester',
//                 stack: ['JavaScript', 'NestJS'],
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//             };

//             jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);

//             const result = await userService.getUserInfo(1);

//             const expectedResponse = new GetUserResponse(mockUser);

//             expect(result).toEqual(expectedResponse);
//         });
//     });
// });
