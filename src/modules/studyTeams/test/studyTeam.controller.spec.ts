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
            service.createStudyTeam.mockResolvedValue({ id: 1 });

            const result = await controller.uploadStudyTeam(
                JSON.stringify(mockCreateStudyTeamRequest),
                [],
                { user: { id: 1 } },
            );

            expect(service.createStudyTeam).toHaveBeenCalled();
            expect(result).toEqual({
                code: 201,
                message: '스터디 공고가 생성되었습니다.',
                data: { id: 1 },
            });
        });
    });

    describe('updateStudyTeam', () => {
        it('should update a study team successfully', async () => {
            service.updateStudyTeam.mockResolvedValue({});

            const result = await controller.updateStudyTeam(
                1,
                JSON.stringify(mockUpdateStudyTeamRequest),
                [],
                { user: { id: 1 } },
            );

            expect(service.updateStudyTeam).toHaveBeenCalled();
            expect(result).toEqual({
                code: 200,
                message: '스터디 공고가 수정되었습니다.',
                data: {},
            });
        });
    });

    describe('closeStudyTeam', () => {
        it('should close a study team successfully', async () => {
            service.closeStudyTeam.mockResolvedValue({});

            const result = await controller.closeStudyTeam(1, {
                user: { id: 1 },
            });

            expect(service.closeStudyTeam).toHaveBeenCalled();
            expect(result).toEqual({
                code: 200,
                message: '스터디 공고가 마감되었습니다.',
                data: {},
            });
        });
    });

    describe('deleteStudyTeam', () => {
        it('should delete a study team successfully', async () => {
            service.deleteStudyTeam.mockResolvedValue({});

            const result = await controller.deleteStudyTeam(1, {
                user: { id: 1 },
            });

            expect(service.deleteStudyTeam).toHaveBeenCalled();
            expect(result).toEqual({
                code: 200,
                message: '스터디 공고가 삭제되었습니다.',
                data: {},
            });
        });
    });

    describe('getUserStudyTeams', () => {
        it('should get user study teams successfully', async () => {
            service.getUserStudyTeams.mockResolvedValue([]);

            const result = await controller.getUserStudyTeams({
                user: { id: 1 },
            });

            expect(service.getUserStudyTeams).toHaveBeenCalled();
            expect(result).toEqual({
                code: 200,
                message: '참여한 스터디 목록 조회에 성공했습니다.',
                data: [],
            });
        });
    });

    describe('getStudyTeamById', () => {
        it('should get study team details successfully', async () => {
            service.getStudyTeamById.mockResolvedValue({});

            const result = await controller.getStudyTeamById(1);

            expect(service.getStudyTeamById).toHaveBeenCalled();
            expect(result).toEqual({
                code: 200,
                message: '스터디 상세 조회에 성공했습니다.',
                data: {},
            });
        });
    });

    describe('getStudyTeamMembersById', () => {
        it('should get study team members successfully', async () => {
            service.getStudyTeamMembersById.mockResolvedValue([]);

            const result = await controller.getStudyTeamMembersById(1);

            expect(service.getStudyTeamMembersById).toHaveBeenCalled();
            expect(result).toEqual({
                code: 200,
                message: '스터디의 모든 인원 조회에 성공했습니다.',
                data: [],
            });
        });
    });

    describe('applyToStudyTeam', () => {
        it('should apply to a study team successfully', async () => {
            service.applyToStudyTeam.mockResolvedValue({});

            const result = await controller.applyToStudyTeam(
                mockCreateStudyMemberRequest,
                { user: { id: 1 } },
            );

            expect(service.applyToStudyTeam).toHaveBeenCalled();
            expect(result).toEqual({
                code: 201,
                message: '스터디 지원에 성공했습니다.',
                data: {},
            });
        });
    });

    describe('cancelApplication', () => {
        it('should cancel an application successfully', async () => {
            service.cancelApplication.mockResolvedValue({});

            const result = await controller.cancelApplication(1, {
                user: { id: 1 },
            });

            expect(service.cancelApplication).toHaveBeenCalled();
            expect(result).toEqual({
                code: 200,
                message: '스터디 지원 취소에 성공했습니다.',
                data: {},
            });
        });
    });

    describe('getApplicants', () => {
        it('should get study applicants successfully', async () => {
            const mockApplicants = [
                {
                    id: 1,
                    name: 'User1',
                },
                {
                    id: 2,
                    name: 'User2',
                },
            ];
            service.getApplicants.mockResolvedValue(mockApplicants);

            const result = await controller.getApplicants(1, {
                user: { id: 1 },
            });

            expect(result).toEqual({
                code: 200,
                message: '스터디 지원자 조회에 성공했습니다.',
                data: mockApplicants,
            });
            expect(service.getApplicants).toHaveBeenCalledWith(1, 1);
        });

        it('should handle errors in getApplicants', async () => {
            service.getApplicants.mockRejectedValue(
                new Error('Failed to get applicants'),
            );

            await expect(
                controller.getApplicants(1, { user: { id: 1 } }),
            ).rejects.toThrow('Failed to get applicants');
        });
    });

    describe('acceptApplicant', () => {
        it('should accept an applicant successfully', async () => {
            const mockRequest = {
                studyTeamId: 1,
                applicantId: 2,
            };

            const mockResponse = {
                id: 1,
                status: 'APPROVED',
            };
            service.acceptApplicant.mockResolvedValue(mockResponse);

            const result = await controller.acceptApplicant(mockRequest, {
                user: { id: 1 },
            });

            expect(result).toEqual({
                code: 200,
                message: '스터디 지원을 수락했습니다.',
                data: mockResponse,
            });
            expect(service.acceptApplicant).toHaveBeenCalledWith(1, 1, 2);
        });

        it('should handle errors in acceptApplicant', async () => {
            const mockRequest = {
                studyTeamId: 1,
                applicantId: 2,
            };

            service.acceptApplicant.mockRejectedValue(
                new Error('Failed to accept applicant'),
            );

            await expect(
                controller.acceptApplicant(mockRequest, { user: { id: 1 } }),
            ).rejects.toThrow('Failed to accept applicant');
        });
    });

    describe('rejectApplicant', () => {
        it('should reject an applicant successfully', async () => {
            const mockRequest = {
                studyTeamId: 1,
                applicantId: 2,
            };

            const mockResponse = {
                id: 1,
                status: 'REJECTED',
            };
            service.rejectApplicant.mockResolvedValue(mockResponse);

            const result = await controller.rejectApplicant(mockRequest, {
                user: { id: 1 },
            });

            expect(result).toEqual({
                code: 200,
                message: '스터디 지원을 거절했습니다.',
                data: mockResponse,
            });
            expect(service.rejectApplicant).toHaveBeenCalledWith(1, 1, 2);
        });

        it('should handle errors in rejectApplicant', async () => {
            const mockRequest = {
                studyTeamId: 1,
                applicantId: 2,
            };

            service.rejectApplicant.mockRejectedValue(
                new Error('Failed to reject applicant'),
            );

            await expect(
                controller.rejectApplicant(mockRequest, { user: { id: 1 } }),
            ).rejects.toThrow('Failed to reject applicant');
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

            expect(result).toEqual({
                code: 201,
                message: '스터디 팀원 추가에 성공했습니다.',
                data: mockResponse,
            });
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
