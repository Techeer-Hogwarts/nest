import { Test, TestingModule } from '@nestjs/testing';
import { ProjectTeamController } from '../projectTeam.controller';
import { ProjectTeamService } from '../projectTeam.service';
import { StudyTeamService } from '../../studyTeams/studyTeam.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { CreateProjectMemberRequest } from '../../projectMembers/dto/request/create.projectMember.request';
import { AddProjectMemberRequest } from '../../projectMembers/dto/request/add.projectMember.request';
import { UpdateApplicantStatusRequest } from '../dto/request/update.applicantStatus.request';
import {
    mockCreateProjectTeamRequest,
    mockUpdateProjectTeamRequest,
    mockProjectTeamResponse,
    mockProjectApplicantResponse,
    mockProjectMemberResponse,
} from './mock-data';
import { NotFoundUserException } from '../../../global/exception/custom.exception';
import { ProjectTeamDetailResponse } from '../dto/response/get.projectTeam.response';

describe('ProjectTeamController', () => {
    let controller: ProjectTeamController;
    let projectTeamService: ProjectTeamService;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let studyTeamService: StudyTeamService;
    let prismaService: PrismaService;

    const mockUser = {
        id: 1,
        name: 'Test User',
    };
    const mockRequest = { user: mockUser };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProjectTeamController],
            providers: [
                {
                    provide: ProjectTeamService,
                    useValue: {
                        createProject: jest.fn(),
                        getAllTeams: jest.fn(),
                        getUserProjects: jest.fn(),
                        updateProjectTeam: jest.fn(),
                        closeProject: jest.fn(),
                        deleteProject: jest.fn(),
                        getProjectById: jest.fn(),
                        getProjectTeamMembersById: jest.fn(),
                        applyToProject: jest.fn(),
                        cancelApplication: jest.fn(),
                        getApplicants: jest.fn(),
                        acceptApplicant: jest.fn(),
                        rejectApplicant: jest.fn(),
                        ensureUserIsProjectMember: jest.fn(),
                        uploadImagesToS3: jest.fn(),
                    },
                },
                {
                    provide: StudyTeamService,
                    useValue: {
                        getAllTeams: jest.fn(),
                    },
                },
                {
                    provide: PrismaService,
                    useValue: {
                        projectMember: {
                            create: jest.fn(),
                        },
                    },
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<ProjectTeamController>(ProjectTeamController);
        projectTeamService = module.get<ProjectTeamService>(ProjectTeamService);
        studyTeamService = module.get<StudyTeamService>(StudyTeamService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createProject', () => {
        it('should create a project', async () => {
            const files: Express.Multer.File[] = [];
            const createProjectTeamRequest = JSON.stringify(
                mockCreateProjectTeamRequest,
            );
            const mockProjectTeamResult1: ProjectTeamDetailResponse = {
                id: 1,
                isDeleted: false,
                isRecruited: false,
                isFinished: false,
                name: 'Test Project',
                githubLink: 'https://github.com/test',
                notionLink: 'https://notion.so/test',
                projectExplain: 'Test explanation',
                frontendNum: 1,
                backendNum: 2,
                devopsNum: 3,
                uiuxNum: 4,
                dataEngineerNum: 5,
                recruitExplain: 'Test recruit explain',
                resultImages: [], // 필요한 경우 데이터를 추가
                mainImages: [],
                teamStacks: [],
                projectMember: [],
                likeCount: 0,
                viewCount: 0,
            };

            // projectTeamService.createProject를 목업하여 CreateProjectResult를 반환하도록 설정
            jest.spyOn(projectTeamService, 'createProject').mockResolvedValue(
                mockProjectTeamResult1,
            );

            const result = await controller.createProject(
                createProjectTeamRequest,
                files,
                mockRequest,
            );

            // 컨트롤러는 projectResponse만 반환함
            expect(result).toEqual(mockProjectTeamResult1);
            expect(projectTeamService.createProject).toHaveBeenCalled();
        });

        it('should throw NotFoundUserException if no user', async () => {
            const files: Express.Multer.File[] = [];
            const createProjectTeamRequest = JSON.stringify(
                mockCreateProjectTeamRequest,
            );

            await expect(
                controller.createProject(createProjectTeamRequest, files, {
                    user: null,
                }),
            ).rejects.toThrow(NotFoundUserException);
        });
    });

    describe('getAllTeams', () => {
        it('should get all teams', async () => {
            const dto = {
                teamTypes: ['project'],
                isRecruited: true,
            };
            const mockTeams = [mockProjectTeamResponse];

            jest.spyOn(projectTeamService, 'getAllTeams').mockResolvedValue(
                mockTeams,
            );

            const result = await controller.getAllTeams(dto);

            expect(result).toEqual(mockTeams);
            expect(projectTeamService.getAllTeams).toHaveBeenCalledWith(dto);
        });
    });

    describe('applyToProject', () => {
        it('should apply to a project', async () => {
            const applyRequest: CreateProjectMemberRequest = {
                projectTeamId: 1,
                teamRole: 'Frontend',
                summary: 'Test application',
            };

            jest.spyOn(projectTeamService, 'applyToProject').mockResolvedValue(
                mockProjectApplicantResponse,
            );

            const result = await controller.applyToProject(
                applyRequest,
                mockRequest,
            );

            expect(result).toEqual(mockProjectApplicantResponse);
            expect(projectTeamService.applyToProject).toHaveBeenCalledWith(
                applyRequest,
                mockUser.id,
            );
        });
    });

    describe('addMemberToProjectTeam', () => {
        it('should add a member to project team', async () => {
            const addMemberRequest: AddProjectMemberRequest = {
                projectTeamId: 1,
                memberId: 2,
                isLeader: false,
                teamRole: 'Backend',
                profileImage: 'https://.jpeg',
            };

            const mockMemberResponse = {
                ...mockProjectMemberResponse,
                id: 1,
                user: {
                    name: 'Test User',
                    profileImage: 'https://.jpeg',
                },
                isLeader: false,
                teamRole: 'Backend',
            };

            jest.spyOn(
                projectTeamService,
                'ensureUserIsProjectMember',
            ).mockResolvedValue(undefined);
            jest.spyOn(prismaService.projectMember, 'create').mockResolvedValue(
                mockMemberResponse,
            );

            const result = await controller.addMemberToProjectTeam(
                addMemberRequest,
                mockRequest,
            );

            expect(result).toEqual(
                expect.objectContaining({
                    userName: 'Test User',
                    profileImage: 'https://.jpeg',
                    status: 'APPROVED',
                    isLeader: false,
                    teamRole: 'Backend',
                }),
            );
            expect(
                projectTeamService.ensureUserIsProjectMember,
            ).toHaveBeenCalledWith(addMemberRequest.projectTeamId, mockUser.id);
        });
    });

    describe('rejectApplicant', () => {
        it('should reject an applicant', async () => {
            const rejectRequest: UpdateApplicantStatusRequest = {
                projectTeamId: 1,
                applicantId: 2,
            };

            jest.spyOn(projectTeamService, 'rejectApplicant').mockResolvedValue(
                mockProjectApplicantResponse,
            );

            const result = await controller.rejectApplicant(
                rejectRequest,
                mockRequest,
            );

            expect(result).toEqual(mockProjectApplicantResponse);
            expect(projectTeamService.rejectApplicant).toHaveBeenCalledWith(
                rejectRequest.projectTeamId,
                mockUser.id,
                rejectRequest.applicantId,
            );
        });
    });
    describe('getUserProjects', () => {
        it('should get user projects', async () => {
            const mockProjects = [
                {
                    ...mockProjectTeamResponse,
                    teamStacks: mockProjectTeamResponse.teamStacks.map(
                        (stack) => ({
                            stackName: stack.stack.name,
                            isMain: stack.isMain,
                        }),
                    ),
                },
            ];

            jest.spyOn(projectTeamService, 'getUserProjects').mockResolvedValue(
                mockProjects,
            );

            const result = await controller.getUserProjects(mockRequest);

            expect(result).toEqual(mockProjects);
            expect(projectTeamService.getUserProjects).toHaveBeenCalledWith(
                mockUser.id,
            );
        });
    });

    describe('updateProject', () => {
        it('should update a project', async () => {
            const projectTeamId = 1;
            const files: Express.Multer.File[] = [];
            const updateProjectTeamRequest = JSON.stringify(
                mockUpdateProjectTeamRequest,
            );

            jest.spyOn(
                projectTeamService,
                'uploadImagesToS3',
            ).mockResolvedValue([]);
            jest.spyOn(
                projectTeamService,
                'updateProjectTeam',
            ).mockResolvedValue(mockProjectTeamResponse);

            const result = await controller.updateProject(
                projectTeamId,
                updateProjectTeamRequest,
                files,
                mockRequest,
            );

            expect(result).toEqual(mockProjectTeamResponse);
            expect(projectTeamService.updateProjectTeam).toHaveBeenCalled();
        });

        it('should throw NotFoundUserException if no user', async () => {
            const projectTeamId = 1;
            const files: Express.Multer.File[] = [];
            const updateProjectTeamRequest = JSON.stringify(
                mockUpdateProjectTeamRequest,
            );

            await expect(
                controller.updateProject(
                    projectTeamId,
                    updateProjectTeamRequest,
                    files,
                    { user: null },
                ),
            ).rejects.toThrow(NotFoundUserException);
        });
    });

    describe('closeProject', () => {
        it('should close a project', async () => {
            const projectTeamId = 1;

            jest.spyOn(projectTeamService, 'closeProject').mockResolvedValue(
                mockProjectTeamResponse,
            );

            const result = await controller.closeProject(
                projectTeamId,
                mockRequest,
            );

            expect(result).toEqual(mockProjectTeamResponse);
            expect(projectTeamService.closeProject).toHaveBeenCalledWith(
                projectTeamId,
                mockUser.id,
            );
        });
    });

    describe('deleteProject', () => {
        it('should delete a project', async () => {
            const projectTeamId = 1;

            jest.spyOn(projectTeamService, 'deleteProject').mockResolvedValue(
                mockProjectTeamResponse,
            );

            const result = await controller.deleteProject(
                projectTeamId,
                mockRequest,
            );

            expect(result).toEqual(mockProjectTeamResponse);
            expect(projectTeamService.deleteProject).toHaveBeenCalledWith(
                projectTeamId,
                mockUser.id,
            );
        });
    });

    describe('getProjectById', () => {
        it('should get project by id', async () => {
            const projectTeamId = 1;

            jest.spyOn(projectTeamService, 'getProjectById').mockResolvedValue(
                mockProjectTeamResponse,
            );

            const result = await controller.getProjectById(projectTeamId);

            expect(result).toEqual(mockProjectTeamResponse);
            expect(projectTeamService.getProjectById).toHaveBeenCalledWith(
                projectTeamId,
            );
        });
    });

    describe('getProjectTeamMembersById', () => {
        it('should get project team members by id', async () => {
            const projectTeamId = 1;
            const mockMembers = [mockProjectMemberResponse];

            jest.spyOn(
                projectTeamService,
                'getProjectTeamMembersById',
            ).mockResolvedValue(mockMembers);

            const result =
                await controller.getProjectTeamMembersById(projectTeamId);

            expect(result).toEqual(mockMembers);
            expect(
                projectTeamService.getProjectTeamMembersById,
            ).toHaveBeenCalledWith(projectTeamId);
        });
    });

    describe('cancelApplication', () => {
        it('should cancel project application', async () => {
            const projectTeamId = 1;

            jest.spyOn(
                projectTeamService,
                'cancelApplication',
            ).mockResolvedValue(mockProjectMemberResponse);

            const result = await controller.cancelApplication(
                projectTeamId,
                mockRequest,
            );

            expect(result).toEqual(mockProjectMemberResponse);
            expect(projectTeamService.cancelApplication).toHaveBeenCalledWith(
                projectTeamId,
                mockUser.id,
            );
        });
    });

    describe('getApplicants', () => {
        it('should get project applicants', async () => {
            const projectTeamId = 1;
            const mockApplicants = [mockProjectApplicantResponse];

            jest.spyOn(projectTeamService, 'getApplicants').mockResolvedValue(
                mockApplicants,
            );

            const result = await controller.getApplicants(
                projectTeamId,
                mockRequest,
            );

            expect(result).toEqual(mockApplicants);
            expect(projectTeamService.getApplicants).toHaveBeenCalledWith(
                projectTeamId,
                mockUser.id,
            );
        });
    });

    describe('acceptApplicant', () => {
        it('should accept project applicant', async () => {
            const acceptRequest: UpdateApplicantStatusRequest = {
                projectTeamId: 1,
                applicantId: 2,
            };

            jest.spyOn(projectTeamService, 'acceptApplicant').mockResolvedValue(
                mockProjectApplicantResponse,
            );

            const result = await controller.acceptApplicant(
                acceptRequest,
                mockRequest,
            );

            expect(result).toEqual(mockProjectApplicantResponse);
            expect(projectTeamService.acceptApplicant).toHaveBeenCalledWith(
                acceptRequest.projectTeamId,
                mockUser.id,
                acceptRequest.applicantId,
            );
        });
    });
});
