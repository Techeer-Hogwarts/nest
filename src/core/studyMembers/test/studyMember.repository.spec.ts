// import { Test, TestingModule } from '@nestjs/testing';
// import { StudyMemberRepository } from '../repository/studyMember.repository';
// import { PrismaService } from '../../prisma/prisma.service';
// // import { StatusCategory } from '@prisma/client';
// // import { CreateStudyMemberRequest } from '../dto/request/create.studyMember.request';
// import { CustomWinstonLogger } from '../../../global/logger/winston.logger';

// describe('StudyMemberRepository', () => {
//     let studyMemberRepository: StudyMemberRepository;
//     let prismaService: PrismaService;
//     // let logger: CustomWinstonLogger;

//     beforeEach(async () => {
//         const module: TestingModule = await Test.createTestingModule({
//             providers: [
//                 StudyMemberRepository,
//                 PrismaService,
//                 {
//                     provide: CustomWinstonLogger,
//                     useValue: {
//                         debug: jest.fn(),
//                         error: jest.fn(),
//                         warn: jest.fn(),
//                     },
//                 },
//             ],
//         }).compile();

//         studyMemberRepository = module.get<StudyMemberRepository>(
//             StudyMemberRepository,
//         );
//         prismaService = module.get<PrismaService>(PrismaService);
//         // logger = module.get<CustomWinstonLogger>(CustomWinstonLogger);
//     });

//     afterEach(() => {
//         jest.clearAllMocks();
//     });

//     describe('checkExistingMember', () => {
//         it('should return true if the user is an existing member', async () => {
//             jest.spyOn(
//                 prismaService.studyMember,
//                 'findFirst',
//             ).mockResolvedValueOnce({} as any);
//             const result = await studyMemberRepository.checkExistingMember(
//                 1,
//                 1,
//             );
//             expect(result).toBe(true);
//         });

//         it('should return false if the user is not an existing member', async () => {
//             jest.spyOn(
//                 prismaService.studyMember,
//                 'findFirst',
//             ).mockResolvedValueOnce(null);
//             const result = await studyMemberRepository.checkExistingMember(
//                 1,
//                 1,
//             );
//             expect(result).toBe(false);
//         });
//     });

//     // describe('isUserAlreadyInStudy', () => {
//     //     it('should return true if the user is already in the study and log a warning', async () => {
//     //         // prismaService.studyMember.findFirst 가 객체를 반환하면 사용자가 이미 존재하는 것으로 간주
//     //         jest.spyOn(
//     //             prismaService.studyMember,
//     //             'findFirst',
//     //         ).mockResolvedValueOnce({} as any);
//     //         const warnSpy = jest.spyOn(logger, 'warn');

//     //         const result = await studyMemberRepository.isUserAlreadyInStudy(
//     //             1,
//     //             1,
//     //         );
//     //         expect(result).toBe(true);
//     //         expect(warnSpy).toHaveBeenCalledWith(
//     //             `User (ID: 1) is already a member of Study Team (ID: 1)`,
//     //         );
//     //     });

//     //     it('should return false if the user is not in the study', async () => {
//     //         jest.spyOn(
//     //             prismaService.studyMember,
//     //             'findFirst',
//     //         ).mockResolvedValueOnce(null);
//     //         const result = await studyMemberRepository.isUserAlreadyInStudy(
//     //             1,
//     //             1,
//     //         );
//     //         expect(result).toBe(false);
//     //     });
//     // });

//     // describe('applyToStudyTeam', () => {
//     //     it('should apply to the study team successfully', async () => {
//     //         jest.spyOn(
//     //             prismaService.studyMember,
//     //             'create',
//     //         ).mockResolvedValueOnce({} as any);
//     //         const request: CreateStudyMemberRequest = {
//     //             studyTeamId: 1,
//     //             summary: 'Sample summary',
//     //         };
//     //         const result = await studyMemberRepository.applyToStudyTeam(
//     //             request,
//     //             1,
//     //         );
//     //         expect(result).toBeDefined();
//     //     });
//     // });

//     // describe('updateApplicantStatus', () => {
//     //     it('should update the status of an applicant', async () => {
//     //         jest.spyOn(
//     //             prismaService.studyMember,
//     //             'update',
//     //         ).mockResolvedValueOnce({} as any);
//     //         const result = await studyMemberRepository.updateApplicantStatus(
//     //             1,
//     //             1,
//     //             StatusCategory.APPROVED,
//     //         );
//     //         expect(result).toBeDefined();
//     //     });
//     // });

//     // describe('addMemberToStudyTeam', () => {
//     //     it('should add a member to the study team successfully', async () => {
//     //         jest.spyOn(
//     //             prismaService.studyMember,
//     //             'create',
//     //         ).mockResolvedValueOnce({} as any);
//     //         const result = await studyMemberRepository.addMemberToStudyTeam(
//     //             1,
//     //             1,
//     //             true,
//     //         );
//     //         expect(result).toBeDefined();
//     //     });
//     // });

//     // describe('isUserMemberOfStudy', () => {
//     //     it('should return true if the user is a member of the study', async () => {
//     //         jest.spyOn(
//     //             prismaService.studyMember,
//     //             'count',
//     //         ).mockResolvedValueOnce(1);
//     //         const result = await studyMemberRepository.isUserMemberOfStudy(
//     //             1,
//     //             1,
//     //         );
//     //         expect(result).toBe(true);
//     //     });

//     //     it('should return false if the user is not a member of the study', async () => {
//     //         jest.spyOn(
//     //             prismaService.studyMember,
//     //             'count',
//     //         ).mockResolvedValueOnce(0);
//     //         const result = await studyMemberRepository.isUserMemberOfStudy(
//     //             1,
//     //             1,
//     //         );
//     //         expect(result).toBe(false);
//     //     });
//     // });

//     describe('getApplicantStatus', () => {
//         it('should return the status of an applicant', async () => {
//             jest.spyOn(
//                 prismaService.studyMember,
//                 'findFirst',
//             ).mockResolvedValueOnce({ status: 'PENDING' } as any);
//             const result = await studyMemberRepository.getApplicantStatus(1, 1);
//             expect(result).toBe('PENDING');
//         });

//         it('should return null if no applicant is found', async () => {
//             jest.spyOn(
//                 prismaService.studyMember,
//                 'findFirst',
//             ).mockResolvedValueOnce(null);
//             const result = await studyMemberRepository.getApplicantStatus(1, 1);
//             expect(result).toBeNull();
//         });
//     });
// });
