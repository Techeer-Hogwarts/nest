import { Test, TestingModule } from '@nestjs/testing';
import { ProjectTeamService } from '../projectTeam.service';
import { ProjectTeamRepository } from '../repository/projectTeam.repository';
import { ProjectMemberRepository } from '../../projectMembers/repository/projectMember.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AwsService } from '../../../awsS3/aws.service';
import {
    mockCreateProjectTeamRequest,
    mockUpdateProjectTeamRequest,
    mockProjectTeamResponse,
} from './mock-data';
import { NotFoundProjectException } from '../../../global/exception/custom.exception';
import { StatusCategory } from '@prisma/client';
import { StackCategory } from '@prisma/client';
import { ProjectTeamDetailResponse } from '../dto/response/get.projectTeam.response';

describe('ProjectTeamService', () => {
    let service: ProjectTeamService;
    let prismaService: PrismaService;
    let projectTeamRepository: ProjectTeamRepository;
    let projectMemberRepository: ProjectMemberRepository;
    let awsService: AwsService;

    const mockUser = {
        id: 1,
        name: 'Test User',
    };
    const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
        destination: '',
        filename: 'test.jpg',
        path: '',
        stream: null,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProjectTeamService,
                {
                    provide: ProjectTeamRepository,
                    useValue: {
                        findProjectByName: jest.fn(),
                        isUserMemberOfProject: jest.fn(),
                        isUserExists: jest.fn(),
                    },
                },
                {
                    provide: ProjectMemberRepository,
                    useValue: {
                        getApplicantStatus: jest.fn(),
                        updateApplicantStatus: jest.fn(),
                        addMemberToProjectTeam: jest.fn(),
                    },
                },
                {
                    provide: PrismaService,
                    useValue: {
                        projectTeam: {
                            findUnique: jest.fn(),
                            findMany: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                        },
                        projectMember: {
                            findFirst: jest.fn(),
                            findMany: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                        },
                        stack: {
                            findMany: jest.fn(),
                        },
                        studyTeam: {
                            findMany: jest.fn(),
                        },
                    },
                },
                {
                    provide: AwsService,
                    useValue: {
                        imageUploadToS3: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ProjectTeamService>(ProjectTeamService);
        prismaService = module.get<PrismaService>(PrismaService);
        projectTeamRepository = module.get<ProjectTeamRepository>(
            ProjectTeamRepository,
        );
        projectMemberRepository = module.get<ProjectMemberRepository>(
            ProjectMemberRepository,
        );
        awsService = module.get<AwsService>(AwsService);
    });

    describe('createProject', () => {
        it('should create a project successfully', async () => {
            const mockStacks = mockCreateProjectTeamRequest.teamStacks.map(
                (stack, index) => ({
                    id: index + 1,
                    name: stack.stack,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    category: 'FRONTEND' as StackCategory,
                }),
            );

            jest.spyOn(
                projectTeamRepository,
                'findProjectByName',
            ).mockResolvedValue(false);
            jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue(
                mockStacks,
            );
            jest.spyOn(awsService, 'imageUploadToS3').mockResolvedValue(
                'https://test.com/image.jpg',
            );

            const mockCreatedProject: ProjectTeamDetailResponse = {
                id: 1,
                name: mockCreateProjectTeamRequest.name,
                isDeleted: false,
                isRecruited: true,
                isFinished: false,
                githubLink: mockCreateProjectTeamRequest.githubLink || '',
                notionLink: mockCreateProjectTeamRequest.notionLink || '',
                projectExplain: mockCreateProjectTeamRequest.projectExplain,
                frontendNum: mockCreateProjectTeamRequest.frontendNum,
                backendNum: mockCreateProjectTeamRequest.backendNum,
                devopsNum: mockCreateProjectTeamRequest.devopsNum || 0,
                uiuxNum: mockCreateProjectTeamRequest.uiuxNum || 0,
                dataEngineerNum:
                    mockCreateProjectTeamRequest.dataEngineerNum || 0,
                recruitExplain: mockCreateProjectTeamRequest.recruitExplain,
                mainImages: [
                    {
                        id: 1,
                        isDeleted: false,
                        imageUrl: 'https://test.com/image.jpg',
                    },
                ],
                teamStacks: mockCreateProjectTeamRequest.teamStacks.map(
                    (stack, index) => ({
                        id: index + 1,
                        stack: { name: stack.stack },
                        isMain: stack.isMain,
                        isDeleted: false,
                        projectTeamId: 1,
                    }),
                ),
                projectMember: mockCreateProjectTeamRequest.projectMember.map(
                    (member) => ({
                        id: 1,
                        name: member.name,
                        userId: member.userId,
                        isLeader: member.isLeader,
                        teamRole: member.teamRole,
                        status: 'APPROVED' as StatusCategory,
                        summary: '초기 참여 인원',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        isDeleted: false,
                        projectTeamId: 1,
                    }),
                ),

                resultImages: [], // 추가된 부분
            };

            jest.spyOn(service, 'createProject').mockResolvedValue(
                mockCreatedProject,
            );

            const result = await service.createProject(
                mockCreateProjectTeamRequest,
                [mockFile, mockFile],
            );

            expect(result).toEqual(mockCreatedProject);
        });
    });

    describe('getProjectById', () => {
        it('should get project by id successfully', async () => {
            const mockProjectDetail = {
                ...mockProjectTeamResponse,
                projectMember: [
                    {
                        ...mockProjectTeamResponse.projectMember[0],
                        user: { name: 'Test User' },
                    },
                ],
            };

            jest.spyOn(
                prismaService.projectTeam,
                'findUnique',
            ).mockResolvedValue(mockProjectDetail);

            const result = await service.getProjectById(1);

            expect(result).toBeDefined();
            expect(prismaService.projectTeam.findUnique).toHaveBeenCalledWith(
                expect.any(Object),
            );
        });

        it('should throw error if project not found', async () => {
            jest.spyOn(
                prismaService.projectTeam,
                'findUnique',
            ).mockResolvedValue(null);
            jest.spyOn(service, 'getProjectById').mockRejectedValue(
                new Error('프로젝트를 찾을 수 없습니다.'),
            );

            await expect(service.getProjectById(999)).rejects.toThrow(
                '프로젝트를 찾을 수 없습니다.',
            );
        });
    });

    describe('updateProjectTeam', () => {
        it('should update project team successfully', async () => {
            const mockStacks = mockUpdateProjectTeamRequest.teamStacks.map(
                (stack, index) => ({
                    id: index + 1,
                    name: stack.stack,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    category: 'FRONTEND' as StackCategory,
                }),
            );

            jest.spyOn(
                service,
                'ensureUserIsProjectMember',
            ).mockResolvedValue();
            jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue(
                mockStacks,
            );

            const mockUpdatedProject = {
                ...mockProjectTeamResponse,
                name: mockUpdateProjectTeamRequest.name,
                teamStacks: mockUpdateProjectTeamRequest.teamStacks.map(
                    (stack, index) => ({
                        id: index + 1,
                        isMain: stack.isMain,
                        isDeleted: false,
                        projectTeamId: 1,
                        stack: { name: stack.stack },
                    }),
                ),
                projectMember: mockUpdateProjectTeamRequest.projectMember.map(
                    (member) => ({
                        id: 1,
                        userId: member.userId,
                        isLeader: member.isLeader,
                        teamRole: member.teamRole,
                        status: 'APPROVED' as StatusCategory,
                        summary: '멤버',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        isDeleted: false,
                        projectTeamId: 1,
                        user: {
                            name: `User ${member.userId}`,
                        },
                    }),
                ),
            };

            jest.spyOn(prismaService.projectTeam, 'update').mockResolvedValue(
                mockUpdatedProject,
            );
            const mockExistingMembers = [
                {
                    userId: 1,
                    isLeader: true,
                    id: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    teamRole: 'Frontend',
                    summary: '기존 멤버',
                    status: 'APPROVED' as StatusCategory,
                    projectTeamId: 1,
                    user: { name: 'User 1' },
                },
                {
                    userId: 2,
                    isLeader: false,
                    id: 2,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    teamRole: 'Backend',
                    summary: '기존 멤버',
                    status: 'APPROVED' as StatusCategory,
                    projectTeamId: 1,
                    user: { name: 'User 2' },
                },
            ];

            jest.spyOn(
                prismaService.projectMember,
                'findMany',
            ).mockResolvedValue(mockExistingMembers);

            const result = await service.updateProjectTeam(
                1,
                mockUser.id,
                {
                    ...mockUpdateProjectTeamRequest,
                    teamStacks: mockUpdateProjectTeamRequest.teamStacks.map(
                        (stack, index) => ({
                            id: index + 1,
                            stack: stack.stack,
                            isMain: stack.isMain,
                        }),
                    ),
                },
                ['https://test.com/image.jpg'],
            );

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(ProjectTeamDetailResponse);
            expect(prismaService.projectTeam.update).toHaveBeenCalled();
        });
    });

    describe('getUserProjects', () => {
        it('should get user projects successfully', async () => {
            jest.spyOn(prismaService.projectTeam, 'findMany').mockResolvedValue(
                [mockProjectTeamResponse],
            );

            const result = await service.getUserProjects(mockUser.id);

            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('applyToProject', () => {
        it('should apply to project successfully', async () => {
            const mockProjectMemberCreateResponse = {
                id: 1,
                projectTeamId: 1,
                userId: mockUser.id,
                teamRole: 'Frontend',
                summary: 'Test',
                status: 'PENDING' as StatusCategory,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                isLeader: false,
                user: {
                    id: mockUser.id,
                    name: 'Test User',
                    // 필요한 다른 사용자 속성들 추가
                },
            };

            jest.spyOn(prismaService.projectMember, 'create').mockResolvedValue(
                mockProjectMemberCreateResponse,
            );

            const result = await service.applyToProject(
                {
                    projectTeamId: 1,
                    teamRole: 'Frontend',
                    summary: 'Test',
                },
                mockUser.id,
            );

            expect(result).toBeDefined();
            expect(result.status).toBe('PENDING');
        });
    });

    describe('cancelApplication', () => {
        it('should cancel project application successfully', async () => {
            const mockProjectMemberFindFirstResponse = {
                id: 1,
                projectTeamId: 1,
                userId: mockUser.id,
                status: 'PENDING' as StatusCategory,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                isLeader: false,
                teamRole: 'Frontend',
                summary: 'Test application',
                user: {
                    id: mockUser.id,
                    name: 'Test User',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    email: 'test@example.com',
                },
            };

            const mockProjectMemberUpdateResponse = {
                ...mockProjectMemberFindFirstResponse,
                isDeleted: true,
            };

            jest.spyOn(
                prismaService.projectMember,
                'findFirst',
            ).mockResolvedValue(mockProjectMemberFindFirstResponse);

            jest.spyOn(prismaService.projectMember, 'update').mockResolvedValue(
                mockProjectMemberUpdateResponse,
            );

            const result = await service.cancelApplication(1, mockUser.id);

            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(result.status).toBe('PENDING');
            expect(result.userName).toBe('Test User');
        });

        it('should throw error if no pending application exists', async () => {
            jest.spyOn(
                prismaService.projectMember,
                'findFirst',
            ).mockResolvedValue(null);

            await expect(
                service.cancelApplication(1, mockUser.id),
            ).rejects.toThrow('취소할 수 있는 지원 내역이 없습니다.');
        });
    });

    describe('getApplicants', () => {
        it('should get project applicants successfully', async () => {
            const mockApplicant = {
                id: 1,
                projectTeamId: 1,
                userId: mockUser.id,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'PENDING' as StatusCategory,
                isLeader: false,
                teamRole: 'Frontend',
                summary: 'Test application',
                user: {
                    id: mockUser.id,
                    name: 'Test User',
                    profileImage: 'https://example.com/profile.jpg',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            };

            jest.spyOn(
                service,
                'ensureUserIsProjectMember',
            ).mockResolvedValue();
            jest.spyOn(
                prismaService.projectMember,
                'findMany',
            ).mockResolvedValue([mockApplicant]);

            const result = await service.getApplicants(1, mockUser.id);

            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('acceptApplicant', () => {
        it('should accept project applicant successfully', async () => {
            const mockApplicant = {
                id: 1,
                projectTeamId: 1,
                userId: mockUser.id,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'APPROVED' as StatusCategory,
                isLeader: false,
                teamRole: 'Frontend',
                summary: 'Test application',
                user: {
                    id: mockUser.id,
                    name: 'Test User',
                    profileImage: 'https://example.com/profile.jpg',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            };

            jest.spyOn(
                service,
                'ensureUserIsProjectMember',
            ).mockResolvedValue();
            jest.spyOn(
                projectMemberRepository,
                'getApplicantStatus',
            ).mockResolvedValue('PENDING');
            jest.spyOn(
                projectMemberRepository,
                'updateApplicantStatus',
            ).mockResolvedValue(mockApplicant);

            const result = await service.acceptApplicant(1, mockUser.id, 2);

            expect(result).toBeDefined();
            expect(result.status).toBe('APPROVED');
        });
    });

    describe('rejectApplicant', () => {
        it('should reject project applicant successfully', async () => {
            const mockApplicant = {
                id: 1,
                projectTeamId: 1,
                userId: mockUser.id,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'REJECT' as StatusCategory,
                isLeader: false,
                teamRole: 'Frontend',
                summary: 'Test application',
                user: {
                    id: mockUser.id,
                    name: 'Test User',
                    profileImage: 'https://example.com/profile.jpg',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            };

            jest.spyOn(
                service,
                'ensureUserIsProjectMember',
            ).mockResolvedValue();
            jest.spyOn(
                projectMemberRepository,
                'getApplicantStatus',
            ).mockResolvedValue('PENDING');
            jest.spyOn(
                projectMemberRepository,
                'updateApplicantStatus',
            ).mockResolvedValue(mockApplicant);

            const result = await service.rejectApplicant(1, mockUser.id, 2);

            expect(result).toBeDefined();
            expect(result.status).toBe('REJECT');
        });
    });

    describe('getAllTeams', () => {
        it('should get all teams successfully', async () => {
            const mockProjectTeams = [
                {
                    ...mockProjectTeamResponse,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    mainImages: [{ imageUrl: 'https://test.com/image.jpg' }],
                    teamStacks: [
                        {
                            stack: { name: 'React.js' },
                            isMain: true,
                        },
                    ],
                    githubLink: 'https://github.com/test',
                    notionLink: 'https://notion.so/test',
                    recruitExplain: 'Test recruit explain',
                    frontendNum: 1,
                    backendNum: 1,
                    devopsNum: 0,
                    uiuxNum: 0,
                    dataEngineerNum: 0,
                },
            ];

            const mockStudyTeams = [
                {
                    id: 2,
                    name: 'Test Study',
                    githubLink: 'https://github.com/test',
                    notionLink: 'https://notion.so/test',
                    goal: 'test goal',
                    rule: 'test rule',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    isRecruited: true,
                    isFinished: false,
                    recruitNum: 5,
                    studyExplain: 'Test study explain',
                    studyMember: [
                        {
                            userId: 1,
                            isLeader: true,
                        },
                    ],
                    recruitExplain: 'Test recruit explain',
                    likeCount: 0,
                    viewCount: 0,
                },
            ];

            jest.spyOn(prismaService.projectTeam, 'findMany').mockResolvedValue(
                mockProjectTeams,
            );
            jest.spyOn(prismaService.studyTeam, 'findMany').mockResolvedValue(
                mockStudyTeams,
            );
            const mockResult = { projectTeams: [mockProjectTeamResponse] };
            jest.spyOn(service, 'getAllTeams').mockResolvedValue(mockResult);

            const result = await service.getAllTeams({});

            expect(result).toBeDefined();
            expect(result.projectTeams).toBeDefined();
        });
    });

    describe('uploadImagesToS3', () => {
        it('should upload images successfully', async () => {
            const mockFiles: Express.Multer.File[] = [
                {
                    ...mockFile,
                    originalname: 'test1.jpg',
                },
                {
                    ...mockFile,
                    originalname: 'test2.png',
                },
            ];

            jest.spyOn(awsService, 'imageUploadToS3').mockResolvedValue(
                'https://test.com/image.jpg',
            );

            const result = await service.uploadImagesToS3(
                mockFiles,
                'project-teams',
            );

            expect(result).toBeDefined();
            expect(result.length).toBe(2);
            expect(awsService.imageUploadToS3).toHaveBeenCalledTimes(2);
        });

        it('should throw error for invalid file extension', async () => {
            const mockFiles: Express.Multer.File[] = [
                {
                    ...mockFile,
                    originalname: 'test.txt',
                },
            ];

            await expect(
                service.uploadImagesToS3(mockFiles, 'project-teams'),
            ).rejects.toThrow('허용되지 않은 파일 확장자입니다.');
        });
    });

    describe('ensureUserIsProjectMember', () => {
        it('should allow user who is a project member', async () => {
            jest.spyOn(
                projectTeamRepository,
                'isUserMemberOfProject',
            ).mockResolvedValue(true);

            await expect(
                service.ensureUserIsProjectMember(1, mockUser.id),
            ).resolves.toBeUndefined();
        });

        it('should throw error for user not in project', async () => {
            jest.spyOn(
                projectTeamRepository,
                'isUserMemberOfProject',
            ).mockResolvedValue(false);
            jest.spyOn(service, 'ensureUserIsProjectMember').mockRejectedValue(
                new Error('사용자가 프로젝트 멤버가 아닙니다.'),
            );

            await expect(
                service.ensureUserIsProjectMember(1, mockUser.id),
            ).rejects.toThrow('사용자가 프로젝트 멤버가 아닙니다.');
        });
    });

    describe('validateStacks', () => {
        it('should validate stacks successfully', async () => {
            const teamStacks = [
                {
                    stack: 'React.js',
                    isMain: true,
                },
                {
                    stack: 'Node.js',
                    isMain: false,
                },
            ];

            jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue([
                {
                    id: 1,
                    name: 'React.js',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    category: 'FRONTEND' as StackCategory,
                },
                {
                    id: 2,
                    name: 'Node.js',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    category: 'BACKEND' as StackCategory,
                },
            ]);

            const result = await (service as any).validateStacks(teamStacks);

            expect(result).toBeDefined();
            expect(result.length).toBe(2);
        });

        it('should throw error for invalid stacks', async () => {
            const teamStacks = [
                {
                    stack: 'Invalid Stack',
                    isMain: true,
                },
            ];

            jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue([]);

            await expect(
                (service as any).validateStacks(teamStacks),
            ).rejects.toThrow('유효하지 않은 스택 이름이 포함되어 있습니다.');
        });
    });

    describe('mapStackData', () => {
        it('should map stack data correctly', async () => {
            const teamStacks = [
                {
                    stack: 'React.js',
                    isMain: true,
                },
            ];
            const validStacks = [
                {
                    id: 1,
                    name: 'React.js',
                },
            ];

            const result = (service as any).mapStackData(
                teamStacks,
                validStacks,
            );

            expect(result).toBeDefined();
            expect(result[0]).toEqual({
                stackId: 1,
                isMain: true,
            });
        });

        it('should throw error for unmatched stack', () => {
            const teamStacks = [
                {
                    stack: 'React.js',
                    isMain: true,
                },
            ];
            const validStacks = [
                {
                    id: 1,
                    name: 'Node.js',
                },
            ];

            expect(() =>
                (service as any).mapStackData(teamStacks, validStacks),
            ).toThrow('스택(React.js)을 찾을 수 없습니다.');
        });
    });

    describe('addMemberToProjectTeam', () => {
        it('should add member to project team successfully', async () => {
            jest.spyOn(
                projectTeamRepository,
                'isUserExists',
            ).mockImplementation((id) =>
                Promise.resolve(id === mockUser.id || id === 2),
            );

            const mockNewMember = {
                id: 3,
                projectTeamId: 1,
                userId: 2,
                isLeader: false,
                teamRole: 'Backend',
                status: 'APPROVED' as StatusCategory,
                user: {
                    name: 'New Member',
                    profileImage: 'https://example.com/profile.jpg',
                },
            };

            jest.spyOn(
                projectMemberRepository,
                'addMemberToProjectTeam',
            ).mockResolvedValue(mockNewMember);

            const result = await service.addMemberToProjectTeam(
                1,
                mockUser.id,
                2,
                false,
                'Backend',
            );

            expect(result).toBeDefined();
            expect(result.userId).toBe(2);
            expect(result.teamRole).toBe('Backend');
        });
    });

    describe('closeProject', () => {
        it('should close project successfully', async () => {
            const mockClosedProject = {
                ...mockProjectTeamResponse,
                isRecruited: false,
            };

            jest.spyOn(service, 'closeProject').mockResolvedValue(
                mockClosedProject,
            );

            const result = await service.closeProject(1, mockUser.id);

            expect(result).toBeDefined();
            expect(result.isRecruited).toBe(false);
        });
    });

    describe('deleteProject', () => {
        it('should delete project successfully', async () => {
            const mockDeletedProject = {
                ...mockProjectTeamResponse,
                isDeleted: true,
            };

            jest.spyOn(service, 'deleteProject').mockResolvedValue(
                mockDeletedProject,
            );

            const result = await service.deleteProject(1, mockUser.id);

            expect(result).toBeDefined();
            expect(result.isDeleted).toBe(true);
        });
    });

    describe('getProjectTeamMembersById', () => {
        it('should get project team members successfully', async () => {
            const mockProjectMembers = [
                {
                    id: 1,
                    projectTeamId: 1,
                    userId: mockUser.id,
                    isLeader: true,
                    teamRole: 'Frontend',
                    status: 'APPROVED' as StatusCategory,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    summary: 'Test project member summary',
                    user: {
                        name: 'Test User',
                        profileImage: 'https://example.com/profile.jpg',
                    },
                },
            ];

            jest.spyOn(
                prismaService.projectMember,
                'findMany',
            ).mockResolvedValue(mockProjectMembers);

            const result = await service.getProjectTeamMembersById(1);

            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThan(0);
        });

        it('should throw error if no project found', async () => {
            jest.spyOn(
                prismaService.projectMember,
                'findMany',
            ).mockResolvedValue([]);
            jest.spyOn(service, 'getProjectTeamMembersById').mockRejectedValue(
                new NotFoundProjectException(),
            );

            await expect(
                service.getProjectTeamMembersById(999),
            ).rejects.toThrow(NotFoundProjectException);
        });
    });
});
