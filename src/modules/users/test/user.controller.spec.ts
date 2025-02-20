// import { Test, TestingModule } from '@nestjs/testing';
// import { UserController } from '../user.controller';
// import { UserService } from '../user.service';
// import { CustomWinstonLogger } from '../../../global/logger/winston.logger';
// import { Request } from 'express';
// import { PermissionRequest, User } from '@prisma/client';
// import { UserRepository } from '../repository/user.repository';

// describe('UserController', () => {
//     let userController: UserController;
//     let userService: UserService;
//     let logger: CustomWinstonLogger;

//     beforeEach(async () => {
//         const module: TestingModule = await Test.createTestingModule({
//             controllers: [UserController],
//             providers: [
//                 {
//                     provide: UserService,
//                     useValue: {
//                         signUp: jest.fn(),
//                         updateUserProfile: jest.fn(),
//                         deleteUser: jest.fn(),
//                         getUserInfo: jest.fn(),
//                         requestPermission: jest.fn(),
//                         getPermissionRequests: jest.fn(),
//                         approvePermission: jest.fn(),
//                         updateProfileImage: jest.fn(),
//                         updateNickname: jest.fn(),
//                         getAllProfiles: jest.fn(),
//                         getProfile: jest.fn(),
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
//                     provide: UserRepository,
//                     useValue: {
//                         findById: jest.fn(),
//                         createUser: jest.fn(),
//                         updateUserProfile: jest.fn(),
//                         deleteUser: jest.fn(),
//                     },
//                 },
//             ],
//         }).compile();

//         userController = module.get<UserController>(UserController);
//         userService = module.get<UserService>(UserService);
//         logger = module.get<CustomWinstonLogger>(CustomWinstonLogger);
//     });

//     it('should be defined', () => {
//         expect(userController).toBeDefined();
//     });

//     describe('signUp', () => {
//         it('should call signUp service method and return user', async () => {
//             const mockUser: User = {
//                 id: 1,
//                 email: 'test@test.com',
//                 password: 'hashedPassword',
//                 name: 'Test User',
//                 year: 6,
//                 isLft: false,
//                 githubUrl: 'https://github.com/test',
//                 velogUrl: 'https://velog.io/test',
//                 mediumUrl: 'https://medium.com/test',
//                 tistoryUrl: 'https://tistory.com/test',
//                 mainPosition: 'Backend',
//                 subPosition: 'Frontend',
//                 school: 'Hogwarts',
//                 grade: '1학년',
//                 profileImage: 'http://image.com',
//                 isDeleted: false,
//                 roleId: 1,
//                 isAuth: true,
//                 nickname: 'Tester',
//                 stack: ['JavaScript', 'NestJS'],
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//             };
//             const mockFile = {
//                 buffer: Buffer.from('test'),
//             } as Express.Multer.File;

//             jest.spyOn(userService, 'signUp').mockResolvedValue(mockUser);

//             const result = await userController.signUp(
//                 {
//                     createUserRequest: {
//                         email: 'test@test.com',
//                         password: 'password123',
//                         name: 'Test User',
//                         year: 6,
//                         githubUrl: 'https://github.com/test',
//                         mainPosition: 'Backend',
//                         school: 'Hogwarts',
//                         grade: '1학년',
//                         isLft: false,
//                         velogUrl: 'https://velog.io/test',
//                         mediumUrl: 'https://medium.com/test',
//                         tistoryUrl: 'https://tistory.com/test',
//                     },
//                     createResumeRequest: {
//                         category: 'PORTFOLIO',
//                         position: 'Backend',
//                         title: 'My Resume',
//                         isMain: true,
//                         url: 'https://example.com/resume.pdf',
//                     },
//                     createUserExperienceRequest: {
//                         experiences: [
//                             {
//                                 position: 'Backend Developer',
//                                 companyName: 'Company A',
//                                 startDate: '2020-01-01',
//                                 endDate: '2020-12-31',
//                                 category: 'Intern',
//                             },
//                         ],
//                     },
//                 },
//                 mockFile,
//             );
//             expect(logger.debug).toHaveBeenCalledWith(
//                 '회원가입 요청 처리 중',
//                 expect.objectContaining({
//                     createUserRequest: expect.any(Object),
//                     createUserExperienceRequest: expect.any(Object),
//                     createResumeRequest: expect.any(Object),
//                     UserController: 'UserController',
//                 }),
//             );
//             expect(userService.signUp).toHaveBeenCalledWith(
//                 {
//                     email: 'test@test.com',
//                     password: 'password123',
//                     name: 'Test User',
//                     year: 6,
//                     githubUrl: 'https://github.com/test',
//                     mainPosition: 'Backend',
//                     school: 'Hogwarts',
//                     grade: '1학년',
//                     isLft: false,
//                     velogUrl: 'https://velog.io/test',
//                     mediumUrl: 'https://medium.com/test',
//                     tistoryUrl: 'https://tistory.com/test',
//                 },
//                 mockFile,
//                 {
//                     category: 'PORTFOLIO',
//                     position: 'Backend',
//                     title: 'My Resume',
//                     isMain: true,
//                     url: 'https://example.com/resume.pdf',
//                 },
//                 {
//                     experiences: [
//                         {
//                             position: 'Backend Developer',
//                             companyName: 'Company A',
//                             startDate: '2020-01-01',
//                             endDate: '2020-12-31',
//                             category: 'Intern',
//                         },
//                     ],
//                 },
//             );
//             expect(result).toEqual(mockUser);
//         });
//     });

//     describe('deleteUser', () => {
//         it('should call deleteUser service method and return deleted user', async () => {
//             const mockUser: User = {
//                 id: 1,
//                 email: 'test@test.com',
//                 password: 'hashedPassword',
//                 name: 'Test User',
//                 year: 6,
//                 isLft: false,
//                 githubUrl: 'https://github.com/test',
//                 velogUrl: 'https://velog.io/test',
//                 mediumUrl: 'https://medium.com/test',
//                 tistoryUrl: 'https://tistory.com/test',
//                 mainPosition: 'Backend',
//                 subPosition: 'Frontend',
//                 school: 'Hogwarts',
//                 grade: '1학년',
//                 profileImage: 'http://image.com',
//                 isDeleted: true,
//                 roleId: 1,
//                 isAuth: true,
//                 nickname: 'Tester',
//                 stack: ['JavaScript', 'NestJS'],
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//             };

//             jest.spyOn(userService, 'deleteUser').mockResolvedValue(mockUser);

//             const mockRequest = {
//                 user: { id: 1 },
//             } as unknown as Request;

//             const result = await userController.deleteUser(mockRequest);

//             expect(userService.deleteUser).toHaveBeenCalledWith(1);
//             expect(result).toEqual(mockUser);
//         });
//     });

//     describe('requestPermission', () => {
//         it('should call requestPermission service method and return permission request', async () => {
//             const mockPermissionRequest: PermissionRequest = {
//                 id: 1,
//                 userId: 1,
//                 requestedRoleId: 2,
//                 status: 'PENDING',
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//             };

//             jest.spyOn(userService, 'requestPermission').mockResolvedValue(
//                 mockPermissionRequest,
//             );

//             const mockRequest = {
//                 user: { id: 1 },
//             } as unknown as Request;

//             const result = await userController.requestPermission(mockRequest, {
//                 roleId: 2,
//             });

//             expect(userService.requestPermission).toHaveBeenCalledWith(1, 2);
//             expect(result).toEqual(mockPermissionRequest);
//         });
//     });
// });
