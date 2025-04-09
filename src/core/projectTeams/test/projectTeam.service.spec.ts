import { jest } from '@jest/globals';

import { Test, TestingModule } from '@nestjs/testing';

import { Prisma } from '@prisma/client';

import {
    isTeamRole,
    TeamRole,
} from '../../../common/category/teamCategory/teamRole.category';
import { MemberStatus } from '../../../common/category/teamCategory/member.category';
import { CreateProjectMemberRequest } from '../../../common/dto/projectMembers/request/create.projectMember.request';
import { ProjectMemberInfoRequest } from '../../../common/dto/projectMembers/request/info.projectMember.request';
import { CustomWinstonLogger } from '../../../common/logger/winston.logger';

import { AwsService } from '../../../infra/awsS3/aws.service';
import { IndexService } from '../../../infra/index/index.service';
import { PrismaService } from '../../../infra/prisma/prisma.service';

import { ProjectMemberService } from '../../projectMembers/projectMember.service';
import {
    ProjectMemberInvalidActiveRequesterException,
    ProjectMemberNotFoundException,
} from '../../projectMembers/exception/projectMember.exception';
import { AlertServcie } from '../../alert/alert.service';
import { ProjectTeamService } from '../projectTeam.service';
import {
    ProjectTeamAlreadyApprovedException,
    ProjectTeamDuplicateTeamNameException,
    ProjectTeamExceededResultImageException,
    ProjectTeamInvalidApplicantException,
    ProjectTeamInvalidTeamRoleException,
    ProjectTeamInvalidTeamStackException,
    ProjectTeamMainImageException,
    ProjectTeamMissingLeaderException,
    ProjectTeamMissingMainImageException,
    ProjectTeamMissingUpdateMemberException,
    ProjectTeamRecruitmentEndedException,
} from '../exception/projectTeam.exception';

import {
    mockCreateProjectTeamRequest,
    mockFile,
    mockFiles,
    mockProjectTeam,
    mockProjectTeamCreatePrisma,
    mockProjectTeamResponse,
    mockUpdatedProject,
    mockUpdateProjectTeamRequest,
    mockValidStack,
} from './mock-data';

describe('ProjectTeamService', () => {
    let service: ProjectTeamService;
    let projectMemberService: ProjectMemberService;
    let prismaService: PrismaService;
    let awsService: AwsService;
    let indexService: IndexService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProjectTeamService,
                ProjectMemberService,
                {
                    provide: PrismaService,
                    useValue: {
                        projectTeam: {
                            findFirst: jest.fn(),
                            findUnique: jest.fn(),
                            findMany: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                        },
                        projectMember: {
                            findFirst: jest.fn(),
                            findUnique: jest.fn(),
                            findMany: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                        },
                        projectResultImage: {
                            findMany: jest.fn(),
                        },
                        stack: {
                            findMany: jest.fn(),
                        },
                        studyTeam: {
                            findMany: jest.fn(),
                        },
                        $transaction: jest.fn(),
                    },
                },
                {
                    provide: AlertServcie,
                    useValue: {
                        sendSlackAlert: jest.fn(),
                        sendUserAlert: jest.fn(),
                    },
                },
                {
                    provide: AwsService,
                    useValue: {
                        imageUploadToS3: jest.fn(),
                    },
                },
                {
                    provide: IndexService,
                    useValue: {
                        createIndex: jest.fn(),
                        deleteIndex: jest.fn(),
                    },
                },
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        debug: jest.fn(),
                        error: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get<ProjectTeamService>(ProjectTeamService);
        projectMemberService =
            module.get<ProjectMemberService>(ProjectMemberService);
        prismaService = module.get<PrismaService>(PrismaService);
        indexService = module.get<IndexService>(IndexService);
        awsService = module.get<AwsService>(AwsService);
        // awsService = module.get<AwsService>(AwsService);
        // logger = module.get<CustomWinstonLogger>(CustomWinstonLogger);
    });
    /**
     * 1. Calculate total recruit member count
     *    - If count == 0, set isRecruit = false
     * 2. Validate duplicate project name (*READ)
     *    - If project name exists, throw an error
     * 3. Validate existence of project team leader
     *    - If no project team leader exists, throw an error
     * 4. Extract mainImage and resultImage from files
     *    - If mainImage is missing, throw an error
     * 5. Validate project member teamRole
     *    - If invalid positions exist in project members, throw an error
     * 6. Fetch teamStacks from StackService by stack name (*READ)
     *    - Match StackResponse names with teamStack names
     *    - If teamStack does not exist in StackService, throw an error
     *    - Map StackData (stackId, isMain)
     * 7. Upload mainImage and resultImages to S3 (*TRANSACTION)
     * 8. Create ProjectTeam (*TRANSACTION)
     *    - Map to ProjectTeamDetailResponse
     * 9. Notify via Slack (*TRANSACTION)
     *    - Extract project team leader info (name, email)
     *    - Map to CreateProjectAlertRequest
     *    - Send to AlertService
     * 10. Indexing (*TRANSACTION)
     *    - Send ProjectTeamDetailResponse to IndexService
     * 11. Return ProjectTeamDetailResponse
     */

    // 1. Calculate total recruit member count
    // - If count == 0, set isRecruit = false
    beforeEach(async () => {
        jest.spyOn(awsService, 'imageUploadToS3').mockResolvedValue(
            'image.jpg',
        );
        jest.spyOn(indexService, 'createIndex').mockResolvedValue(undefined);
    });
    describe('createProjectTeam', () => {
        describe('1. Calculate total recruit member count', () => {
            beforeEach(async () => {
                jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue(
                    mockValidStack,
                );
                jest.spyOn(
                    prismaService.projectTeam,
                    'create',
                ).mockResolvedValue(mockProjectTeamCreatePrisma);
            });
            it('Total recruit member count is 0 then isRecruit===false', async () => {
                const request = mockCreateProjectTeamRequest;
                request.frontendNum = 0;
                request.backendNum = 0;
                request.devopsNum = 0;
                request.dataEngineerNum = 0;
                request.fullStackNum = 0;
                request.isRecruited = true;

                await service.createProject(request, mockFiles);

                expect(request.isRecruited).toBe(false);
            });
        });

        // 2. Validate duplicate project name (*READ)
        // - If project name exists, throw an error
        describe('2. Validate duplicate project name', () => {
            beforeEach(async () => {
                jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue(
                    mockValidStack,
                );
                jest.spyOn(
                    prismaService.projectTeam,
                    'create',
                ).mockResolvedValue(mockProjectTeamCreatePrisma);
            });
            it('Not exists name in project team then success', async () => {
                jest.spyOn(
                    prismaService.projectTeam,
                    'findFirst',
                ).mockResolvedValue(null);

                await expect(
                    service.createProject(
                        mockCreateProjectTeamRequest,
                        mockFiles,
                    ),
                ).resolves.not.toThrow();
            });
            it('Exists name in project team then throw DuplicateTeamNameException', async () => {
                jest.spyOn(
                    prismaService.projectTeam,
                    'findFirst',
                ).mockResolvedValueOnce(mockProjectTeamResponse);

                await expect(
                    service.createProject(
                        mockCreateProjectTeamRequest,
                        mockFiles,
                    ),
                ).rejects.toThrow(ProjectTeamDuplicateTeamNameException);
            });
        });
        beforeEach(async () => {
            jest.spyOn(
                prismaService.projectTeam,
                'findFirst',
            ).mockResolvedValue(null);
        });

        // 3. Validate existence of project team leader
        // - If no project team leader exists, throw an error
        describe('3. Validate existence of project team leader', () => {
            beforeEach(async () => {
                jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue(
                    mockValidStack,
                );
                jest.spyOn(
                    prismaService.projectTeam,
                    'create',
                ).mockResolvedValue(mockProjectTeamCreatePrisma);
            });
            it('Not exists team leader then throw MissingLeaderException', async () => {
                const mockMember1 = {
                    userId: 1,
                    name: 'test',
                    isLeader: false,
                    teamRole: TeamRole.FRONTEND,
                    email: 'test@example.com',
                };
                const mockMember2 = {
                    userId: 2,
                    name: 'test',
                    isLeader: false,
                    teamRole: TeamRole.FRONTEND,
                    email: 'test@example.com',
                };
                const request = mockCreateProjectTeamRequest;
                request.projectMember = [mockMember1, mockMember2];
                await expect(
                    service.createProject(request, mockFiles),
                ).rejects.toThrow(ProjectTeamMissingLeaderException);
            });

            it('Exists team leader then success', async () => {
                const mockMember1 = {
                    userId: 1,
                    name: 'test',
                    isLeader: true,
                    teamRole: TeamRole.FRONTEND,
                    email: 'test@example.com',
                };
                const mockMember2 = {
                    userId: 2,
                    name: 'test',
                    isLeader: false,
                    teamRole: TeamRole.FRONTEND,
                    email: 'test@example.com',
                };
                const request = mockCreateProjectTeamRequest;
                request.projectMember = [mockMember1, mockMember2];
                await expect(
                    service.createProject(request, mockFiles),
                ).resolves.not.toThrow();
            });
        });

        // 4. Extract mainImage and resultImage from files
        //    - If mainImage is missing, throw an error
        describe('4. Extract mainImage and resultImage from files', () => {
            beforeEach(async () => {
                jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue(
                    mockValidStack,
                );
                jest.spyOn(
                    prismaService.projectTeam,
                    'create',
                ).mockResolvedValue(mockProjectTeamCreatePrisma);
            });

            it('Not exist files then throw MissingMainImageException ', async () => {
                await expect(
                    service.createProject(mockCreateProjectTeamRequest, []),
                ).rejects.toThrow();
            });

            it('Exist file then Success ', async () => {
                await expect(
                    service.createProject(mockCreateProjectTeamRequest, [
                        mockFile,
                    ]),
                ).resolves.not.toThrow(ProjectTeamMissingMainImageException);
            });

            it('Exist files then Success ', async () => {
                await expect(
                    service.createProject(
                        mockCreateProjectTeamRequest,
                        mockFiles,
                    ),
                ).resolves.not.toThrow();
            });
        });

        // 5. Validate project member teamRole
        // - If invalid positions exist in project members, throw an error
        describe('5. Validate project member teamRole', () => {
            beforeEach(async () => {
                jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue(
                    mockValidStack,
                );
                jest.spyOn(
                    prismaService.projectTeam,
                    'create',
                ).mockResolvedValue(mockProjectTeamCreatePrisma);
            });
            const validTeamRole = [
                'Backend',
                'Frontend',
                'DevOps',
                'FullStack',
                'DataEngineer',
            ];
            const invalidTeamRole = ['backend', 'Front', '', null, undefined];

            describe('Test method: isTeamRole', () => {
                Object.values(validTeamRole).forEach((role) => {
                    it(`"${role}" as a valid team role and toBe true`, () => {
                        expect(isTeamRole(role)).toBe(true);
                    });
                });
                Object.values(invalidTeamRole).forEach((role) => {
                    it(`"${role}" as a invalid team role and toBe false`, () => {
                        expect(isTeamRole(role)).toBe(false);
                    });
                });
            });

            it('TeamRoles validate then success', async () => {
                const backend = {
                    userId: 1,
                    isLeader: true,
                    teamRole: TeamRole.BACKEND,
                };
                const frontend = {
                    userId: 2,
                    isLeader: false,
                    teamRole: TeamRole.FRONTEND,
                };
                const devOps = {
                    userId: 2,
                    isLeader: false,
                    teamRole: TeamRole.DEV_OPS,
                };
                const fullStack = {
                    userId: 2,
                    isLeader: false,
                    teamRole: TeamRole.FULL_STACK,
                };
                const dataEngineer = {
                    userId: 2,
                    isLeader: false,
                    teamRole: TeamRole.DATA_ENGINEER,
                };
                const request = mockCreateProjectTeamRequest;
                request.projectMember = [
                    backend,
                    frontend,
                    devOps,
                    fullStack,
                    dataEngineer,
                ];
                await expect(
                    service.createProject(request, mockFiles),
                ).resolves.not.toThrow();
            });

            it('TeamRoles is Optional', async () => {
                const backend: ProjectMemberInfoRequest = {
                    userId: 1,
                    isLeader: true,
                    teamRole: TeamRole.BACKEND,
                };
                const frontend: ProjectMemberInfoRequest = {
                    userId: 2,
                    isLeader: false,
                    teamRole: TeamRole.FRONTEND,
                };
                const devOps: ProjectMemberInfoRequest = {
                    userId: 2,
                    isLeader: false,
                    teamRole: null,
                };
                const fullStack: ProjectMemberInfoRequest = {
                    userId: 2,
                    isLeader: false,
                    teamRole: undefined,
                };
                const dataEngineer: ProjectMemberInfoRequest = {
                    userId: 2,
                    isLeader: false,
                    teamRole: TeamRole.DATA_ENGINEER,
                };
                const request = mockCreateProjectTeamRequest;
                request.projectMember = [
                    backend,
                    frontend,
                    devOps,
                    fullStack,
                    dataEngineer,
                ];
                await expect(
                    service.createProject(request, mockFiles),
                ).resolves.not.toThrow();
            });
        });
        // 6. Fetch teamStacks from StackService by stack name (*READ)
        // - Match StackResponse names with teamStack names
        // - If teamStack does not exist in StackService, throw an error
        // - Map StackData (stackId, isMain)
        describe('6. Fetch teamStacks from StackService by stack name (*READ)', () => {
            beforeEach(async () => {
                jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue(
                    mockValidStack,
                );
                jest.spyOn(
                    prismaService.projectTeam,
                    'create',
                ).mockResolvedValue(mockProjectTeamCreatePrisma);
            });

            it('If teamStack is null then stackData is empty array', async () => {
                const request = mockCreateProjectTeamRequest;
                request.teamStacks = [];
                jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue(
                    [],
                );

                await expect(
                    service.createProject(request, mockFiles),
                ).resolves.not.toThrow();
            });

            it('If teamStackData is invalid then throw error', async () => {
                const mockTeamStack1 = {
                    stack: 'Nest.js',
                    isMain: false,
                };
                const mockTeamStack2 = {
                    stack: 'SpringBoo',
                    isMain: false,
                };
                const request = mockCreateProjectTeamRequest;
                request.teamStacks = [mockTeamStack1, mockTeamStack2];
                jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue([
                    {
                        id: 1,
                        name: 'Nest.js',
                        createdAt: undefined,
                        updatedAt: undefined,
                        isDeleted: false,
                        category: 'BACKEND',
                    },
                ]);

                await expect(
                    service.createProject(request, mockFiles),
                ).rejects.toThrow();
            });

            it('If duplicate teamStack then throw error', async () => {
                const mockTeamStack1 = {
                    stack: 'Nest.js',
                    isMain: false,
                };
                const mockTeamStack2 = {
                    stack: 'Nest.js',
                    isMain: false,
                };
                const request = mockCreateProjectTeamRequest;
                request.teamStacks = [mockTeamStack1, mockTeamStack2];
                jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue([
                    {
                        id: 1,
                        name: 'Next.js',
                        createdAt: undefined,
                        updatedAt: undefined,
                        isDeleted: false,
                        category: 'BACKEND',
                    },
                    {
                        id: 2,
                        name: 'Next.js',
                        createdAt: undefined,
                        updatedAt: undefined,
                        isDeleted: false,
                        category: 'FRONTEND',
                    },
                ]);

                await expect(
                    service.createProject(request, mockFiles),
                ).rejects.toThrow();
            });
            it('Validate teamStack then success', async () => {
                const mockTeamStack1 = {
                    stack: 'Nest.js',
                    isMain: false,
                };
                const mockTeamStack2 = {
                    stack: 'SpringBoot',
                    isMain: false,
                };
                const request = mockCreateProjectTeamRequest;
                request.teamStacks = [mockTeamStack1, mockTeamStack2];
                jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue([
                    {
                        id: 1,
                        name: 'Next.js',
                        createdAt: undefined,
                        updatedAt: undefined,
                        isDeleted: false,
                        category: 'BACKEND',
                    },
                    {
                        id: 2,
                        name: 'SpringBoot.js',
                        createdAt: undefined,
                        updatedAt: undefined,
                        isDeleted: false,
                        category: 'FRONTEND',
                    },
                ]);

                await expect(
                    service.createProject(request, mockFiles),
                ).resolves.not.toThrow();
            });
        });

        describe('updateProjectTeam', () => {
            describe('Test validateMainImagesFunction', () => {
                function validateMainImages(
                    mainLength: number,
                    deleteLength: number,
                ): void {
                    // 추가되는 메인 이미지가 1개 초과인 경우 || 삭제되는 메인 이미지가 1개 초과인 경우
                    if (mainLength > 1 || deleteLength > 1) {
                        throw new Error(
                            'main image는 1개만 설정할 수 있습니다',
                        );
                    } // else 추가되는 메인 이미지 0 or 1, 삭제되는 메인 이미지 0 or 1
                    // 삭제하는 메인 이미지가 있는데,
                    if (mainLength === 1 && deleteLength !== 1) {
                        throw new Error('main image를 설정해주세요');
                    }
                    if (mainLength === 0 && deleteLength !== 0) {
                        throw new Error('기존 main image를 삭제해주세요.');
                    }
                }
                it('If mainImage is empty array, deleteImagesLength is 1 then throw', async () => {
                    const mockMainImage: Express.Multer.File[] = [];
                    const mockDeleteMainImage = [1];
                    expect(() =>
                        validateMainImages(
                            mockMainImage.length,
                            mockDeleteMainImage.length,
                        ),
                    ).toThrow('기존 main image를 삭제해주세요.');
                });
                it('If mainImage is empty array, deleteImagesLength is 2 then throw', async () => {
                    const mockMainImage: Express.Multer.File[] = [];
                    const mockDeleteMainImage = [1, 2];
                    expect(() =>
                        validateMainImages(
                            mockMainImage.length,
                            mockDeleteMainImage.length,
                        ),
                    ).toThrow('main image는 1개만 설정할 수 있습니다');
                });
            });
        });
    });
    describe('updateProjectTeam', () => {
        const projectId = 1;
        const userId = 1;
        const tx = {
            projectTeam: {
                update: jest.fn<any>().mockResolvedValue(mockUpdatedProject),
            },
            projectMember: {
                update: jest.fn<any>().mockResolvedValue(undefined),
                create: jest.fn<any>().mockResolvedValue(undefined),
                updateMany: jest.fn<any>().mockResolvedValue(undefined),
            },
        } as unknown as Prisma.TransactionClient;

        beforeEach(async () => {
            jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue([
                {
                    id: 1,
                    name: 'React.js',
                    createdAt: undefined,
                    updatedAt: undefined,
                    isDeleted: false,
                    category: 'BACKEND',
                },
                {
                    id: 2,
                    name: 'Node.js',
                    createdAt: undefined,
                    updatedAt: undefined,
                    isDeleted: false,
                    category: 'BACKEND',
                },
            ]);

            jest.spyOn(
                prismaService.projectResultImage,
                'findMany',
            ).mockResolvedValue([
                {
                    id: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    projectTeamId: 1,
                    imageUrl: '',
                },
                {
                    id: 2,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    imageUrl: '',
                    projectTeamId: 1,
                },
            ]);

            jest.spyOn(
                prismaService.projectTeam,
                'findFirst',
            ).mockResolvedValue(null);
            jest.spyOn(prismaService, '$transaction').mockImplementation(
                async (callback) => await callback(tx),
            );
            jest.spyOn(
                projectMemberService,
                'isProjectMember',
            ).mockResolvedValue();
            jest.spyOn(
                projectMemberService,
                'findManyActiveProjectMembers',
            ).mockResolvedValue([
                {
                    id: 1,
                    isDeleted: false,
                    isLeader: true,
                    teamRole: 'Frontend',
                    status: MemberStatus.APPROVED,
                    user: { id: 1 },
                },
            ]);
        });

        describe('1. 전체 모집 인원 수 0명이면 IsRecruited: false', () => {
            it('전체 모집 인원 수가 0이되면 request.isRecruited === false이다.', async () => {
                const request = mockUpdateProjectTeamRequest;
                request.frontendNum = 0;
                request.backendNum = 0;
                request.devopsNum = 0;
                request.dataEngineerNum = 0;
                request.fullStackNum = 0;
                request.isRecruited = true;

                await service.updateProjectTeam(projectId, userId, request);

                expect(request.isRecruited).toBe(false);
            });
        });

        describe('2. 요청자가 프로젝트 멤버인지 확인', () => {
            it('요청자가 프로젝트 멤버가 아닌 경우 ProjectMemberInvalidActiveRequester 예외가 발생한다.', async () => {
                const request = mockUpdateProjectTeamRequest;
                jest.spyOn(
                    projectMemberService,
                    'isProjectMember',
                ).mockRejectedValue(
                    new ProjectMemberInvalidActiveRequesterException(),
                );
                await expect(
                    service.updateProjectTeam(projectId, userId, request),
                ).rejects.toThrow(ProjectMemberInvalidActiveRequesterException);
            });
        });

        describe('3. 리더 존재 여부 확인', () => {
            it('리더가 없는 경우 MissingLeader 예외가 발생한다.', async () => {
                const request = mockUpdateProjectTeamRequest;
                request.projectMember = [
                    {
                        userId: 1,
                        isLeader: false,
                        teamRole: TeamRole.BACKEND,
                    },
                ];

                await expect(
                    service.updateProjectTeam(projectId, userId, request),
                ).rejects.toThrow(ProjectTeamMissingLeaderException);
            });
        });

        describe('4. TeamRole 검증', () => {
            it('요청한 팀 스택과 실제 존재하는 스택이 다르면 ProjectTeamInvalidTeamStack 예외가 발생한다.', async () => {
                const request = mockUpdateProjectTeamRequest;
                request.projectMember = [
                    {
                        userId: 1,
                        isLeader: true,
                        teamRole: TeamRole.BACKEND,
                    },
                ];
                jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue([
                    {
                        id: 1,
                        name: 'React.js',
                    } as any,
                ]);

                await expect(
                    service.updateProjectTeam(
                        projectId,
                        userId,
                        request,
                        mockFiles,
                    ),
                ).rejects.toThrow(ProjectTeamInvalidTeamStackException);
            });
        });

        describe('5. 업데이트 멤버 정렬', () => {
            beforeEach(async () => {
                jest.spyOn(
                    projectMemberService,
                    'findManyActiveProjectMembers',
                ).mockResolvedValue([
                    {
                        id: 1,
                        status: MemberStatus.APPROVED,
                        isDeleted: false,
                        teamRole: TeamRole.BACKEND,
                        isLeader: true,
                        user: {
                            id: 1,
                        },
                    },
                    {
                        id: 2,
                        status: MemberStatus.APPROVED,
                        isDeleted: true,
                        teamRole: TeamRole.BACKEND,
                        isLeader: true,
                        user: {
                            id: 2,
                        },
                    },
                ]);
            });
            it('삭제되는 멤버를 다시 삭제요청을 하는 경우 ProjectMemberNotFoundException 예외가 발생한다.', async () => {
                jest.spyOn(
                    projectMemberService,
                    'findManyActiveProjectMembers',
                ).mockResolvedValue([
                    {
                        id: 1,
                        status: MemberStatus.APPROVED,
                        isDeleted: false,
                        teamRole: TeamRole.BACKEND,
                        isLeader: true,
                        user: {
                            id: 1,
                        },
                    },
                    {
                        id: 2,
                        status: MemberStatus.APPROVED,
                        isDeleted: true,
                        teamRole: TeamRole.BACKEND,
                        isLeader: true,
                        user: {
                            id: 2,
                        },
                    },
                ]);
                const request = mockUpdateProjectTeamRequest;
                request.projectMember = [
                    {
                        userId: 1,
                        isLeader: true,
                        teamRole: TeamRole.BACKEND,
                    },
                ];
                request.deleteMembers = [2];

                await expect(
                    service.updateProjectTeam(projectId, userId, request),
                ).rejects.toThrow(ProjectMemberNotFoundException);
            });

            it('삭제 멤버와 업데이트 멤버가 중복되면 ProjectTeamDuplicateDeleteUpdate 예외가 발생한다.', async () => {
                const request = mockUpdateProjectTeamRequest;
                request.projectMember = [
                    {
                        userId: 1,
                        isLeader: true,
                        teamRole: TeamRole.BACKEND,
                    },
                    {
                        userId: 2,
                        isLeader: true,
                        teamRole: TeamRole.BACKEND,
                    },
                ];
                request.deleteMembers = [2];

                await expect(
                    service.updateProjectTeam(projectId, userId, request),
                ).rejects.toThrow(ProjectMemberNotFoundException);
            });
            it('요청 멤버, 삭제 멤버, 기존 멤버 수가 일치하지 않으면 ProjectTeamMissingUpdateMemberException 예외가 발생한다.', async () => {
                const request = mockUpdateProjectTeamRequest;
                request.projectMember = [
                    {
                        userId: 1,
                        isLeader: true,
                        teamRole: TeamRole.BACKEND,
                    },
                ];
                request.deleteMembers = [];

                await expect(
                    service.updateProjectTeam(projectId, userId, request),
                ).rejects.toThrow(ProjectTeamMissingUpdateMemberException);
            });
            it('success', async () => {
                jest.spyOn(
                    projectMemberService,
                    'findManyActiveProjectMembers',
                ).mockResolvedValue([
                    {
                        id: 1,
                        status: MemberStatus.APPROVED,
                        isDeleted: false,
                        teamRole: TeamRole.BACKEND,
                        isLeader: true,
                        user: {
                            id: 1,
                        },
                    },
                    {
                        id: 2,
                        status: MemberStatus.APPROVED,
                        isDeleted: false,
                        teamRole: TeamRole.BACKEND,
                        isLeader: true,
                        user: {
                            id: 2,
                        },
                    },
                ]);
                const request = mockUpdateProjectTeamRequest;
                request.projectMember = [
                    {
                        userId: 1,
                        isLeader: true,
                        teamRole: TeamRole.BACKEND,
                    },
                ];
                request.deleteMembers = [2];

                await expect(
                    service.updateProjectTeam(projectId, userId, request),
                ).resolves.not.toThrow();
            });
        });

        describe('6. 팀 스택 검증, 가공', () => {
            it('팀 스택이 중복되면 ProjectTeamInvalidTeamStack 예외가 발생한다.', async () => {
                jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue([
                    {
                        id: 1,
                        name: 'React.js',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        isDeleted: false,
                        category: 'FRONTEND',
                    },
                    {
                        id: 1,
                        name: 'React.js',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        isDeleted: false,
                        category: 'FRONTEND',
                    },
                ]);
                jest.spyOn(
                    projectMemberService,
                    'findManyActiveProjectMembers',
                ).mockResolvedValue([
                    {
                        id: 1,
                        status: MemberStatus.APPROVED,
                        isDeleted: false,
                        teamRole: TeamRole.FRONTEND,
                        isLeader: true,
                        user: {
                            id: 1,
                        },
                    },
                    {
                        id: 2,
                        status: MemberStatus.APPROVED,
                        isDeleted: true,
                        teamRole: TeamRole.FRONTEND,
                        isLeader: true,
                        user: {
                            id: 2,
                        },
                    },
                ]);
                const request = mockUpdateProjectTeamRequest;
                request.projectMember = [
                    {
                        userId: 1,
                        isLeader: true,
                        teamRole: TeamRole.FRONTEND,
                    },
                    {
                        userId: 2,
                        isLeader: true,
                        teamRole: TeamRole.FRONTEND,
                    },
                ];
                request.teamStacks = [
                    {
                        id: 1,
                        stack: 'React.js',
                        isMain: true,
                    },
                    {
                        id: 1,
                        stack: 'React.js',
                        isMain: false,
                    },
                ];

                await expect(
                    service.updateProjectTeam(projectId, userId, request),
                ).rejects.toThrow(ProjectTeamInvalidTeamStackException);
            });
        });

        beforeEach(async () => {
            jest.spyOn(
                projectMemberService,
                'findManyActiveProjectMembers',
            ).mockResolvedValue([
                {
                    id: 1,
                    status: MemberStatus.APPROVED,
                    isDeleted: false,
                    teamRole: TeamRole.FRONTEND,
                    isLeader: true,
                    user: {
                        id: 1,
                    },
                },
            ]);
            jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue([
                {
                    id: 1,
                    name: 'React.js',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    category: 'FRONTEND',
                },
                {
                    id: 2,
                    name: 'Node.js',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    category: 'FRONTEND',
                },
            ]);
        });

        describe('7. MainImage 검증', () => {
            it('업데이트 되는 MainImage가 2개 이상이면 ProjectTeamMainImage 예외가 발생한다.', async () => {
                await expect(
                    service.updateProjectTeam(
                        projectId,
                        userId,
                        mockUpdateProjectTeamRequest,
                        mockFiles,
                    ),
                ).rejects.toThrow(ProjectTeamMainImageException);
            });
            it('업데이트 되는 deleteMainImage가 2개 이상이면 ProjectTeamMainImage 예외가 발생한다.', async () => {
                const request = mockUpdateProjectTeamRequest;
                request.deleteMainImages = [1, 2];
                await expect(
                    service.updateProjectTeam(projectId, userId, request, [
                        mockFile,
                    ]),
                ).rejects.toThrow(ProjectTeamMainImageException);
            });
            it('삭제되는 mainImage가 있을 때 업데이트 이미지가 없으면 ProjectTeamMainImage 예외가 발생한다.', async () => {
                const request = mockUpdateProjectTeamRequest;
                request.deleteMainImages = [1];
                await expect(
                    service.updateProjectTeam(projectId, userId, request),
                ).rejects.toThrow(ProjectTeamMainImageException);
            });
        });

        describe('8. ResultImage 검증', () => {
            it('ResultImage의 개수가 10개 초과이면 ProjectTeamExceededResultImage 예외가 발생한다.', async () => {
                const request = mockUpdateProjectTeamRequest;
                jest.spyOn(
                    prismaService.projectResultImage,
                    'findMany',
                ).mockResolvedValue([
                    {
                        id: 1,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        isDeleted: false,
                        projectTeamId: 1,
                        imageUrl: '',
                    },
                ]);
                const mockMainFile = [];
                const mockResultFiles = [
                    mockFile,
                    mockFile,
                    mockFile,
                    mockFile,
                    mockFile,
                    mockFile,
                    mockFile,
                    mockFile,
                    mockFile,
                    mockFile,
                ];
                await expect(
                    service.updateProjectTeam(
                        projectId,
                        userId,
                        request,
                        mockMainFile,
                        mockResultFiles,
                    ),
                ).rejects.toThrow(ProjectTeamExceededResultImageException);
            });

            it('ResultImage의 개수가 10개 이하이면 성공한다.', async () => {
                const request = mockUpdateProjectTeamRequest;
                jest.spyOn(
                    prismaService.projectResultImage,
                    'findMany',
                ).mockResolvedValue([
                    {
                        id: 1,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        isDeleted: false,
                        projectTeamId: 1,
                        imageUrl: '',
                    },
                ]);
                const mockMainFile = [];
                const mockResultFiles = [
                    mockFile,
                    mockFile,
                    mockFile,
                    mockFile,
                    mockFile,
                    mockFile,
                    mockFile,
                    mockFile,
                    mockFile,
                ];
                await expect(
                    service.updateProjectTeam(
                        projectId,
                        userId,
                        request,
                        mockMainFile,
                        mockResultFiles,
                    ),
                ).resolves.not.toThrow();
            });
        });

        describe('9. 이름이 변경되는 경우 이름 중복 검증', () => {
            it('중복되는 아이디가 다른 ProjectTeam PK이면 ProjectTeamDuplicateTeamName 예외가 발생한다.', async () => {
                const request = mockUpdateProjectTeamRequest;
                jest.spyOn(
                    prismaService.projectTeam,
                    'findFirst',
                ).mockResolvedValue({
                    id: 2,
                    name: '프로젝트',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                } as any);
                await expect(
                    service.updateProjectTeam(projectId, userId, request),
                ).rejects.toThrow(ProjectTeamDuplicateTeamNameException);
            });
        });
    });

    describe('applyToProject', () => {
        describe('2. 지원자 포지션을 모집 중인지 확인', () => {
            it('모집 마감한 프로젝트이면 ProjectTeamRecruitmentEnded 예외를 반환한다. ', async () => {
                const byebyeProject = mockProjectTeam;
                byebyeProject.isRecruited = false;
                jest.spyOn(
                    prismaService.projectTeam,
                    'findUnique',
                ).mockResolvedValue(byebyeProject);
                const request: CreateProjectMemberRequest = {
                    projectTeamId: 1,
                    teamRole: TeamRole.BACKEND,
                    summary: '날 살리도',
                };

                await expect(
                    service.applyToProject(request, 1),
                ).rejects.toThrow(ProjectTeamRecruitmentEndedException);
            });
            it('지원한 포지션이 유효하지 않으면 ProjectTeamInvalidTeamRole 예외를 반환한다. ', async () => {
                jest.spyOn(
                    prismaService.projectTeam,
                    'findUnique',
                ).mockResolvedValue(mockProjectTeam);
                const request: CreateProjectMemberRequest = {
                    projectTeamId: 1,
                    teamRole: 'TeamRole.BACKEND',
                    summary: '날 살리도',
                };

                await expect(
                    service.applyToProject(request, 1),
                ).rejects.toThrow(ProjectTeamInvalidTeamRoleException);
            });
            it('지원한 포지션의 모집인원이 0이면 ProjectTeamInvalidTeamRole 예외를 반환한다. ', async () => {
                const zeroProject = mockProjectTeam;
                zeroProject.backendNum = 0;
                jest.spyOn(
                    prismaService.projectTeam,
                    'findUnique',
                ).mockResolvedValue(zeroProject);
                const request: CreateProjectMemberRequest = {
                    projectTeamId: 1,
                    teamRole: TeamRole.BACKEND,
                    summary: '날 살리도',
                };

                await expect(
                    service.applyToProject(request, 1),
                ).rejects.toThrow(ProjectTeamInvalidTeamRoleException);
            });
        });
    });

    describe('acceptApplicant', () => {
        const tx = {
            projectTeam: {
                update: jest.fn<any>().mockResolvedValue(mockUpdatedProject),
            },
            projectMember: {
                update: jest.fn<any>().mockResolvedValue({
                    id: 1,
                    isLeader: false,
                    teamRole: TeamRole.BACKEND,
                    summary: '하하하하하하핳',
                    status: MemberStatus.APPROVED,
                    user: {
                        id: 1,
                        name: '아무개',
                        profileImage: '',
                        email: '',
                        year: 99999,
                    },
                }),
            },
        } as unknown as Prisma.TransactionClient;
        beforeEach(() => {
            jest.spyOn(prismaService, '$transaction').mockImplementation(
                async (callback) => await callback(tx),
            );
            jest.spyOn(
                prismaService.projectTeam,
                'findUnique',
            ).mockResolvedValue(mockProjectTeam);
            jest.spyOn(
                projectMemberService,
                'isProjectMember',
            ).mockResolvedValue();
        });

        describe('Validate applicant status', () => {
            it('PENDING 상태인 지원자가 취소하여 isDeleted === true이면 ProjectTeamInvalidApplicant 예외가 발생한다. ', async () => {
                jest.spyOn(
                    projectMemberService,
                    'findUniqueAcceptedApplicant',
                ).mockResolvedValue({
                    id: 1,
                    status: MemberStatus.PENDING,
                    isDeleted: true,
                    teamRole: TeamRole.BACKEND,
                });

                await expect(service.acceptApplicant(1, 2, 1)).rejects.toThrow(
                    ProjectTeamInvalidApplicantException,
                );
            });
            it('PENDING 상태가 아니면 ProjectTeamInvalidApplicant 예외가 발생한다. ', async () => {
                jest.spyOn(
                    projectMemberService,
                    'findUniqueAcceptedApplicant',
                ).mockResolvedValue({
                    id: 1,
                    status: MemberStatus.REJECT,
                    isDeleted: false,
                    teamRole: TeamRole.BACKEND,
                });

                await expect(service.acceptApplicant(1, 2, 1)).rejects.toThrow(
                    ProjectTeamInvalidApplicantException,
                );
            });
        });
        describe('Validate applicant status', () => {
            it('TeamRole 유효하지 않으면 ProjectTeamInvalidTeamRole 예외가 발생한다.', async () => {
                jest.spyOn(
                    projectMemberService,
                    'findUniqueAcceptedApplicant',
                ).mockResolvedValue({
                    id: 1,
                    status: MemberStatus.PENDING,
                    isDeleted: false,
                    teamRole: 'TeamRole.BACKEND',
                });

                await expect(service.acceptApplicant(1, 2, 1)).rejects.toThrow(
                    ProjectTeamInvalidTeamRoleException,
                );
            });
        });
    });
    describe('rejectApplicant', () => {
        beforeEach(() => {
            jest.spyOn(
                projectMemberService,
                'isProjectMember',
            ).mockResolvedValue();
        });

        describe('지원자 상태 검증', () => {
            it('지원자 상태가 APPROVED 이면 AlreadyApproved 예외가 발생한다.', async () => {
                jest.spyOn(
                    projectMemberService,
                    'findUniqueRejectedApplicant',
                ).mockResolvedValue({
                    id: 1,
                    status: MemberStatus.APPROVED,
                });

                await expect(service.rejectApplicant(1, 2, 1)).rejects.toThrow(
                    ProjectTeamAlreadyApprovedException,
                );
            });
            it('지원자 상태가 REJECT 이면 ProjectTeamInvalidApplicant 예외가 발생한다.', async () => {
                jest.spyOn(
                    projectMemberService,
                    'findUniqueAcceptedApplicant',
                ).mockResolvedValue({
                    id: 1,
                    status: MemberStatus.REJECT,
                    isDeleted: false,
                    teamRole: TeamRole.BACKEND,
                });

                await expect(service.acceptApplicant(1, 2, 1)).rejects.toThrow(
                    ProjectTeamInvalidApplicantException,
                );
            });
        });
    });
});
