import { Test, TestingModule } from '@nestjs/testing';
import { StudyTeamController } from '../studyTeam.controller';
import { StudyTeamService } from '../studyTeam.service';
import { UserRepository } from '../../users/repository/user.repository';
import { JwtAuthGuard } from '../../../auth/jwt.guard';
import {
    mockCreateStudyTeamRequest,
    mockUpdateStudyTeamRequest,
    mockCreateStudyMemberRequest,
} from './mock-data';
import {
    GetStudyTeamResponse,
    StudyApplicantResponse,
    StudyMemberResponse,
} from '../dto/response/get.studyTeam.response';
type StatusCategory = 'PENDING' | 'APPROVED' | 'REJECT';

describe('StudyTeamController', () => {
    let controller: StudyTeamController;
    let service: jest.Mocked<StudyTeamService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [StudyTeamController],
            providers: [
                {
                    provide: StudyTeamService,
                    useValue: {
                        createStudyTeam: jest.fn(),
                        updateStudyTeam: jest.fn(),
                        closeStudyTeam: jest.fn(),
                        deleteStudyTeam: jest.fn(),
                        getUserStudyTeams: jest.fn(),
                        getStudyTeamById: jest.fn(),
                        getStudyTeamMembersById: jest.fn(),
                        applyToStudyTeam: jest.fn(),
                        cancelApplication: jest.fn(),
                        getApplicants: jest.fn(),
                        acceptApplicant: jest.fn(),
                        rejectApplicant: jest.fn(),
                        addMemberToStudyTeam: jest.fn(),
                    },
                },
                {
                    provide: JwtAuthGuard,
                    useValue: {
                        canActivate: jest.fn().mockReturnValue(true),
                    },
                },
                {
                    provide: UserRepository,
                    useValue: {
                        findUserById: jest.fn().mockReturnValue({
                            id: 1,
                            username: 'testuser',
                        }),
                    },
                },
            ],
        }).compile();

        controller = module.get<StudyTeamController>(StudyTeamController);
        service = module.get(StudyTeamService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('uploadStudyTeam', () => {
        it('should create a study team successfully', async () => {
            const mockStudyTeam = {
                id: 1,
                name: 'Test Study',
                notionLink: 'https://notion.so/test',
                recruitExplain: 'test',
                recruitNum: 5,
                rule: 'test rule',
                goal: 'test goal',
                studyExplain: 'test explain',
                isRecruited: false,
                isFinished: false,
                resultImages: [],
                studyMember: [],
                likeCount: 0,
                viewCount: 0,
            };

            service.createStudyTeam.mockResolvedValue(mockStudyTeam);

            const result = await controller.uploadStudyTeam(
                JSON.stringify(mockCreateStudyTeamRequest),
                [],
                { user: { id: 1 } },
            );

            expect(service.createStudyTeam).toHaveBeenCalled();
            expect(result).toEqual(mockStudyTeam);
        });
    });

    describe('updateStudyTeam', () => {
        it('should update a study team successfully', async () => {
            const mockUpdatedStudy = {
                id: 1,
                name: 'Updated Study',
                notionLink: 'https://notion.so/updated',
                recruitExplain: 'updated',
                recruitNum: 6,
                rule: 'updated rule',
                goal: 'updated goal',
                studyExplain: 'updated explain',
                isRecruited: true,
                isFinished: false,
                resultImages: [],
                studyMember: [],
                likeCount: 0,
                viewCount: 0,
            };

            service.updateStudyTeam.mockResolvedValue(mockUpdatedStudy);

            const result = await controller.updateStudyTeam(
                1,
                JSON.stringify(mockUpdateStudyTeamRequest),
                [],
                { user: { id: 1 } },
            );

            expect(service.updateStudyTeam).toHaveBeenCalled();
            expect(result).toEqual(mockUpdatedStudy);
        });
    });

    describe('closeStudyTeam', () => {
        it('should close a study team successfully', async () => {
            const mockClosedStudy: GetStudyTeamResponse = {
                id: 1,
                name: 'Test Study',
                notionLink: 'https://notion.so/test',
                recruitExplain: 'test',
                recruitNum: 5,
                rule: 'test rule',
                goal: 'test goal',
                studyExplain: 'test explain',
                isRecruited: true, // 마감되어서 true
                isFinished: false,
                resultImages: [],
                studyMember: [],
                likeCount: 0,
                viewCount: 0,
            };

            service.closeStudyTeam.mockResolvedValue(mockClosedStudy);

            const result = await controller.closeStudyTeam(1, {
                user: { id: 1 },
            });

            expect(service.closeStudyTeam).toHaveBeenCalled();
            expect(result).toEqual(mockClosedStudy);
        });
    });

    describe('deleteStudyTeam', () => {
        it('should delete a study team successfully', async () => {
            const mockDeletedStudy: GetStudyTeamResponse = {
                id: 1,
                name: 'Test Study',
                notionLink: 'https://notion.so/test',
                recruitExplain: 'test',
                recruitNum: 5,
                rule: 'test rule',
                goal: 'test goal',
                studyExplain: 'test explain',
                isRecruited: false,
                isFinished: false,
                resultImages: [],
                studyMember: [],
                likeCount: 0,
                viewCount: 0,
            };

            service.deleteStudyTeam.mockResolvedValue(mockDeletedStudy);

            const result = await controller.deleteStudyTeam(1, {
                user: { id: 1 },
            });

            expect(service.deleteStudyTeam).toHaveBeenCalled();
            expect(result).toEqual(mockDeletedStudy);
        });
    });

    describe('getUserStudyTeams', () => {
        it('should get user study teams successfully', async () => {
            const mockStudyTeams = [
                {
                    id: 1,
                    name: 'Test Study 1',
                    notionLink: 'https://notion.so/test',
                    recruitExplain: 'test',
                    recruitNum: 5,
                    rule: 'test rule',
                    goal: 'test goal',
                    studyExplain: 'test explain',
                    isRecruited: false,
                    isFinished: false,
                    resultImages: [],
                    studyMember: [],
                    likeCount: 0,
                    viewCount: 0,
                },
            ];

            service.getUserStudyTeams.mockResolvedValue(mockStudyTeams);

            const result = await controller.getUserStudyTeams({
                user: { id: 1 },
            });

            expect(service.getUserStudyTeams).toHaveBeenCalled();
            expect(result).toEqual(mockStudyTeams);
        });
    });

    describe('getStudyTeamById', () => {
        it('should get study team details successfully', async () => {
            const mockStudy: GetStudyTeamResponse = {
                id: 1,
                name: 'Test Study',
                notionLink: 'https://notion.so/test',
                recruitExplain: 'test',
                recruitNum: 5,
                rule: 'test rule',
                goal: 'test goal',
                studyExplain: 'test explain',
                isRecruited: false,
                isFinished: false,
                resultImages: [],
                studyMember: [],
                likeCount: 0,
                viewCount: 0,
            };

            service.getStudyTeamById.mockResolvedValue(mockStudy);

            const result = await controller.getStudyTeamById(1);

            expect(service.getStudyTeamById).toHaveBeenCalled();
            expect(result).toEqual(mockStudy);
        });
    });

    describe('getStudyTeamMembersById', () => {
        it('should get study team members successfully', async () => {
            const mockMembers = [
                {
                    id: 1,
                    name: 'User1',
                    isLeader: true,
                    teamRole: 'Leader',
                },
                {
                    id: 2,
                    name: 'User2',
                    isLeader: false,
                    teamRole: 'Member',
                },
            ];

            service.getStudyTeamMembersById.mockResolvedValue(mockMembers);

            const result = await controller.getStudyTeamMembersById(1);

            expect(service.getStudyTeamMembersById).toHaveBeenCalled();
            expect(result).toEqual(mockMembers);
        });
    });

    describe('applyToStudyTeam', () => {
        it('should apply to a study team successfully', async () => {
            const mockApplicant = {
                id: 1,
                name: 'Applicant',
                isLeader: false,
                summary: 'Test application',
                status: 'PENDING' as StatusCategory,
            };

            service.applyToStudyTeam.mockResolvedValue(mockApplicant);

            const result = await controller.applyToStudyTeam(
                mockCreateStudyMemberRequest,
                { user: { id: 1 } },
            );

            expect(service.applyToStudyTeam).toHaveBeenCalled();
            expect(result).toEqual(mockApplicant);
        });
    });

    describe('cancelApplication', () => {
        it('should cancel an application successfully', async () => {
            const mockCanceledMember: StudyMemberResponse = {
                id: 1,
                name: 'Test User',
                isLeader: false,
            };

            service.cancelApplication.mockResolvedValue(mockCanceledMember);

            const result = await controller.cancelApplication(1, {
                user: { id: 1 },
            });

            expect(service.cancelApplication).toHaveBeenCalled();
            expect(result).toEqual(mockCanceledMember);
        });
    });

    describe('getApplicants', () => {
        it('should get study applicants successfully', async () => {
            const mockApplicants: StudyApplicantResponse[] = [
                {
                    id: 1,
                    name: 'Applicant 1',
                    isLeader: false,
                    summary: 'Test application 1',
                    status: 'PENDING' as StatusCategory,
                },
                {
                    id: 2,
                    name: 'Applicant 2',
                    isLeader: false,
                    summary: 'Test application 2',
                    status: 'PENDING' as StatusCategory,
                },
            ];

            service.getApplicants.mockResolvedValue(mockApplicants);

            const result = await controller.getApplicants(1, {
                user: { id: 1 },
            });

            expect(service.getApplicants).toHaveBeenCalledWith(1, 1);
            expect(result).toEqual(mockApplicants);
        });
    });

    describe('acceptApplicant', () => {
        it('should accept an applicant successfully', async () => {
            const mockAcceptedApplicant: StudyApplicantResponse = {
                id: 1,
                name: 'Accepted Applicant',
                isLeader: false,
                summary: 'Test application',
                status: 'APPROVED' as StatusCategory,
            };

            service.acceptApplicant.mockResolvedValue(mockAcceptedApplicant);

            const mockRequest = {
                studyTeamId: 1,
                applicantId: 2,
            };

            const result = await controller.acceptApplicant(mockRequest, {
                user: { id: 1 },
            });

            expect(service.acceptApplicant).toHaveBeenCalledWith(1, 1, 2);
            expect(result).toEqual(mockAcceptedApplicant);
        });
    });

    describe('rejectApplicant', () => {
        it('should reject an applicant successfully', async () => {
            const mockRejectedApplicant: StudyApplicantResponse = {
                id: 1,
                name: 'Rejected Applicant',
                isLeader: false,
                summary: 'Test application',
                status: 'REJECT' as StatusCategory,
            };

            service.rejectApplicant.mockResolvedValue(mockRejectedApplicant);

            const mockRequest = {
                studyTeamId: 1,
                applicantId: 2,
            };

            const result = await controller.rejectApplicant(mockRequest, {
                user: { id: 1 },
            });

            expect(service.rejectApplicant).toHaveBeenCalledWith(1, 1, 2);
            expect(result).toEqual(mockRejectedApplicant);
        });
    });

    describe('addMemberToStudyTeam', () => {
        it('should add a member to the study team successfully', async () => {
            const mockRequest = {
                studyTeamId: 1,
                memberId: 2,
                isLeader: true,
                profileImage: 'https://s3-url.com/test.jpg',
            };

            const mockResponse = {
                id: 1,
                name: 'New Member',
                isLeader: true,
            };
            service.addMemberToStudyTeam.mockResolvedValue(mockResponse);

            const result = await controller.addMemberToStudyTeam(mockRequest, {
                user: { id: 1 },
            });

            expect(result).toEqual(mockResponse);
            expect(service.addMemberToStudyTeam).toHaveBeenCalledWith(
                1,
                1,
                2,
                true,
            );
        });

        it('should handle errors in addMemberToStudyTeam', async () => {
            const mockRequest = {
                studyTeamId: 1,
                memberId: 2,
                isLeader: true,
                profileImage: 'https://s3-url.com/test.jpg',
            };

            service.addMemberToStudyTeam.mockRejectedValue(
                new Error('Failed to add member'),
            );

            await expect(
                controller.addMemberToStudyTeam(mockRequest, {
                    user: { id: 1 },
                }),
            ).rejects.toThrow('Failed to add member');
        });
    });
});
