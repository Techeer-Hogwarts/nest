import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectTeamService } from '../projectTeam.service';
import { ProjectTeamRepository } from '../repository/projectTeam.repository';
import { ProjectMemberRepository } from '../../projectMembers/repository/projectMember.repository';

import { StatusCategory } from '@prisma/client';
import { StackCategory } from '@prisma/client';
import { AlertServcie } from '../../alert/alert.service';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { AwsService } from '../../../infra/awsS3/aws.service';
import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
import {
    mockCreateProjectTeamRequest,
    mockFile,
    mockFiles,
    mockProjectTeamCreatePrisma,
    mockProjectTeamResponse,
    mockValidStack,
    mockZeroProjectRecruitmentRequest,
} from './mock-data';
import { IndexService } from '../../../infra/index/index.service';
import {
    isTeamRole,
    TeamRole,
    TeamRoleType,
} from '../../../common/category/teamRole.category';
import { ProjectMemberInfoRequest } from '../../../common/dto/projectMembers/request/info.projectMember.request';
// import { AlreadyApprovedException } from '../../../global/exception/custom.exception';

describe('ProjectTeamService', () => {
    let service: ProjectTeamService;
    let prismaService: PrismaService;
    let projectTeamRepository: ProjectTeamRepository;
    let projectMemberRepository: ProjectMemberRepository;
    let awsService: AwsService;
    let indexService: IndexService;
    // let logger: CustomWinstonLogger;

    const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
    };
    // const mockFile: Express.Multer.File = {
    //     fieldname: 'file',
    //     originalname: 'test.jpg',
    //     encoding: '7bit',
    //     mimetype: 'image/jpeg',
    //     size: 1024,
    //     buffer: Buffer.from('test'),
    //     destination: '',
    //     filename: 'test.jpg',
    //     path: '',
    //     stream: null,
    // };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProjectTeamService,
                {
                    provide: ProjectMemberRepository,
                    useValue: {
                        getApplicantStatus: jest.fn(),
                        updateApplicantStatus: jest.fn(),
                        addMemberToProjectTeam: jest.fn(),
                    },
                },
                {
                    provide: ProjectTeamRepository,
                    useValue: {
                        findProjectByName: jest.fn(),
                        isUserMemberOfProject: jest.fn(),
                        isUserExists: jest.fn(),
                    },
                },
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
        indexService = module.get<IndexService>(IndexService);
        awsService = module.get<AwsService>(AwsService);
        service = module.get<ProjectTeamService>(ProjectTeamService);
        prismaService = module.get<PrismaService>(PrismaService);
        projectMemberRepository = module.get<ProjectMemberRepository>(
            ProjectMemberRepository,
        );
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
            it('Exists name in project team then throw error', async () => {
                jest.spyOn(
                    prismaService.projectTeam,
                    'findFirst',
                ).mockResolvedValueOnce(mockProjectTeamResponse);

                await expect(
                    service.createProject(
                        mockCreateProjectTeamRequest,
                        mockFiles,
                    ),
                ).rejects.toThrow();
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
            it('Not exists team leader then fail', async () => {
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
                ).rejects.toThrow();
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

            it('Not exist files then throw error ', async () => {
                await expect(
                    service.createProject(mockCreateProjectTeamRequest, []),
                ).rejects.toThrow();
            });

            it('Exist file then Success ', async () => {
                await expect(
                    service.createProject(mockCreateProjectTeamRequest, [
                        mockFile,
                    ]),
                ).resolves.not.toThrow();
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

            it('TeamRoles not validate then fail', async () => {
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
                ).rejects.toThrow();
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
});

// describe('createProject', () => {
//     it('should create a project successfully and log "프로젝트 DB 생성 시작"', async () => {
//         const mockStacks = mockCreateProjectTeamRequest.teamStacks.map(
//             (stack, index) => ({
//                 id: index + 1,
//                 name: stack.stack,
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//                 isDeleted: false,
//                 category: 'FRONTEND' as StackCategory,
//             }),
//         );

//         jest.spyOn(
//             projectTeamRepository,
//             'findProjectByName',
//         ).mockResolvedValue(false);
//         jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue(
//             mockStacks,
//         );

//         // uploadImagesToS3를 모킹하여 메인 이미지 및 결과 이미지 URL을 반환하도록 함
//         jest.spyOn(service, 'uploadImagesToS3').mockImplementation(
//             async (
//                 files: Express.Multer.File[] | Express.Multer.File,
//                 _folder: string,
//             ) => {
//                 void _folder;
//                 return Array.isArray(files)
//                     ? files.map(() => 'https://test.com/image.jpg')
//                     : ['https://test.com/image.jpg'];
//             },
//         );

//         const mockCreatedProject = {
//             id: 1,
//             name: mockCreateProjectTeamRequest.name,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             isDeleted: false,
//             isRecruited: true,
//             isFinished: false,
//             githubLink: mockCreateProjectTeamRequest.githubLink || '',
//             notionLink: mockCreateProjectTeamRequest.notionLink || '',
//             projectExplain: mockCreateProjectTeamRequest.projectExplain,
//             frontendNum: mockCreateProjectTeamRequest.frontendNum,
//             backendNum: mockCreateProjectTeamRequest.backendNum,
//             devopsNum: mockCreateProjectTeamRequest.devopsNum || 0,
//             fullStackNum: mockCreateProjectTeamRequest.fullStackNum || 0,
//             dataEngineerNum:
//                 mockCreateProjectTeamRequest.dataEngineerNum || 0,
//             recruitExplain: mockCreateProjectTeamRequest.recruitExplain,
//             mainImages: [
//                 {
//                     id: 1,
//                     isDeleted: false,
//                     imageUrl: 'https://test.com/image.jpg',
//                 },
//             ],
//             teamStacks: mockCreateProjectTeamRequest.teamStacks.map(
//                 (stack, index) => ({
//                     id: index + 1,
//                     stack: { name: stack.stack },
//                     isMain: stack.isMain,
//                     isDeleted: false,
//                     projectTeamId: 1,
//                 }),
//             ),
//             projectMember: mockCreateProjectTeamRequest.projectMember.map(
//                 (member) => ({
//                     id: 1,
//                     name: member.name,
//                     userId: member.userId,
//                     isLeader: member.isLeader,
//                     teamRole: member.teamRole,
//                     status: 'APPROVED' as StatusCategory,
//                     summary: '초기 참여 인원',
//                     createdAt: new Date(),
//                     updatedAt: new Date(),
//                     isDeleted: false,
//                     projectTeamId: 1,
//                     email: member.email,
//                 }),
//             ),
//             likeCount: 0,
//             viewCount: 0,
//             resultImages: [],
//         };

//         jest.spyOn(prismaService.projectTeam, 'create').mockResolvedValue(
//             mockCreatedProject,
//         );

//         // 실제 구현 실행
//         const result = await service.createProject(
//             mockCreateProjectTeamRequest,
//             [mockFile, mockFile],
//         );

//         expect(result).toEqual(
//             expect.objectContaining({ id: mockCreatedProject.id }),
//         );
//         expect(
//             projectTeamRepository.findProjectByName,
//         ).toHaveBeenCalledWith(mockCreateProjectTeamRequest.name);
//         expect(prismaService.stack.findMany).toHaveBeenCalled();

//         // 로거 호출 검증
//         expect(logger.debug).toHaveBeenCalledWith(
//             '🔥 [START] createProject 요청 시작',
//         );
//         expect(logger.debug).toHaveBeenCalledWith(
//             '메인 이미지 업로드 시작',
//         );
//         expect(logger.debug).toHaveBeenCalledWith('프로젝트 DB 생성 시작');
//         // ... 추가 검증 가능
//     });
// });
//
// describe('getProjectById', () => {
//     it('should get project by id successfully', async () => {
//         const mockProjectDetail = {
//             ...mockProjectTeamResponse,
//             projectMember: [
//                 {
//                     ...mockProjectTeamResponse.projectMember[0],
//                     user: { name: 'Test User' },
//                 },
//             ],
//         };
//
//         jest.spyOn(prismaService.projectTeam, 'update').mockResolvedValue(
//             mockProjectDetail,
//         );
//
//         const result = await service.getProjectById(1);
//
//         expect(result).toBeDefined();
//         expect(prismaService.projectTeam.update).toHaveBeenCalledWith(
//             expect.any(Object),
//         );
//     });
//
//     it('should throw error if project not found', async () => {
//         jest.spyOn(
//             prismaService.projectTeam,
//             'findUnique',
//         ).mockResolvedValue(null);
//         jest.spyOn(service, 'getProjectById').mockRejectedValue(
//             new Error('프로젝트를 찾을 수 없습니다.'),
//         );
//
//         await expect(service.getProjectById(999)).rejects.toThrow(
//             '프로젝트를 찾을 수 없습니다.',
//         );
//     });
// });
//
// // describe('updateProjectTeam', () => {
// //     it('should update project team successfully', async () => {
// //         const mockStacks = mockUpdateProjectTeamRequest.teamStacks.map(
// //             (stack, index) => ({
// //                 id: index + 1,
// //                 name: stack.stack,
// //                 createdAt: new Date(),
// //                 updatedAt: new Date(),
// //                 isDeleted: false,
// //                 category: 'FRONTEND' as StackCategory,
// //             }),
// //         );
// //
// //         jest.spyOn(
// //             service,
// //             'ensureUserIsProjectMember',
// //         ).mockResolvedValue();
// //         jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue(
// //             mockStacks,
// //         );
// //
// //         const mockUpdatedProject = {
// //             ...mockProjectTeamResponse,
// //             name: mockUpdateProjectTeamRequest.name,
// //             teamStacks: mockUpdateProjectTeamRequest.teamStacks.map(
// //                 (stack, index) => ({
// //                     id: index + 1,
// //                     isMain: stack.isMain,
// //                     isDeleted: false,
// //                     projectTeamId: 1,
// //                     stack: { name: stack.stack },
// //                 }),
// //             ),
// //             projectMember: mockUpdateProjectTeamRequest.projectMember.map(
// //                 (member) => ({
// //                     id: 1,
// //                     userId: member.userId,
// //                     isLeader: member.isLeader,
// //                     teamRole: member.teamRole,
// //                     status: 'APPROVED' as StatusCategory,
// //                     summary: '멤버',
// //                     createdAt: new Date(),
// //                     updatedAt: new Date(),
// //                     isDeleted: false,
// //                     projectTeamId: 1,
// //                     user: {
// //                         name: `User ${member.userId}`,
// //                     },
// //                 }),
// //             ),
// //         };
// //
// //         jest.spyOn(prismaService.projectTeam, 'update').mockResolvedValue(
// //             mockUpdatedProject,
// //         );
// //         const mockExistingMembers = [
// //             {
// //                 userId: 1,
// //                 isLeader: true,
// //                 id: 1,
// //                 createdAt: new Date(),
// //                 updatedAt: new Date(),
// //                 isDeleted: false,
// //                 teamRole: 'Frontend',
// //                 summary: '기존 멤버',
// //                 status: 'APPROVED' as StatusCategory,
// //                 projectTeamId: 1,
// //                 user: { name: 'User 1' },
// //             },
// //             {
// //                 userId: 2,
// //                 isLeader: false,
// //                 id: 2,
// //                 createdAt: new Date(),
// //                 updatedAt: new Date(),
// //                 isDeleted: false,
// //                 teamRole: 'Backend',
// //                 summary: '기존 멤버',
// //                 status: 'APPROVED' as StatusCategory,
// //                 projectTeamId: 1,
// //                 user: { name: 'User 2' },
// //             },
// //         ];
// //
// //         jest.spyOn(
// //             prismaService.projectMember,
// //             'findMany',
// //         ).mockResolvedValue(mockExistingMembers);
// //
// //         const result = await service.updateProjectTeam(
// //             1,
// //             mockUser.id,
// //             {
// //                 ...mockUpdateProjectTeamRequest,
// //                 teamStacks: mockUpdateProjectTeamRequest.teamStacks.map(
// //                     (stack, index) => ({
// //                         id: index + 1,
// //                         stack: stack.stack,
// //                         isMain: stack.isMain,
// //                     }),
// //                 ),
// //             },
// //             ['https://test.com/image.jpg'],
// //         );
// //
// //         expect(result).toBeDefined();
// //         expect(result).toBeInstanceOf(ProjectTeamDetailResponse);
// //         expect(prismaService.projectTeam.update).toHaveBeenCalled();
// //     });
// // });
//
// describe('getUserProjects', () => {
//     it('should get user projects successfully', async () => {
//         jest.spyOn(prismaService.projectTeam, 'findMany').mockResolvedValue(
//             [mockProjectTeamResponse],
//         );
//
//         const result = await service.getUserProjects(mockUser.id);
//
//         expect(result).toBeDefined();
//         expect(result.length).toBeGreaterThan(0);
//     });
// });
//
// // describe('applyToProject', () => {
// //     it('should apply to project successfully', async () => {
// //         const mockProjectMemberCreateResponse = {
// //             id: 1,
// //             projectTeamId: 1,
// //             userId: mockUser.id,
// //             teamRole: 'Frontend',
// //             summary: 'Test',
// //             status: 'PENDING' as StatusCategory,
// //             createdAt: new Date(),
// //             updatedAt: new Date(),
// //             isDeleted: false,
// //             isLeader: false,
// //             user: {
// //                 id: mockUser.id,
// //                 name: 'Test User',
// //                 // 필요한 다른 사용자 속성들 추가
// //             },
// //         };
// //
// //         jest.spyOn(prismaService.projectMember, 'create').mockResolvedValue(
// //             mockProjectMemberCreateResponse,
// //         );
// //
// //         const result = await service.applyToProject(
// //             {
// //                 projectTeamId: 1,
// //                 teamRole: 'Frontend',
// //                 summary: 'Test',
// //             },
// //             mockUser.id,
// //         );
// //
// //         expect(result).toBeDefined();
// //         expect(result.status).toBe('PENDING');
// //     });
// // });
//
// describe('cancelApplication', () => {
//     it('should cancel project application successfully', async () => {
//         const mockProjectMemberFindFirstResponse = {
//             id: 1,
//             projectTeamId: 1,
//             userId: mockUser.id,
//             status: 'PENDING' as StatusCategory,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             isDeleted: false,
//             isLeader: false,
//             teamRole: 'Frontend',
//             summary: 'Test application',
//             user: {
//                 id: mockUser.id,
//                 name: 'Test User',
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//                 email: 'test@example.com',
//             },
//         };
//
//         const mockProjectMemberUpdateResponse = {
//             ...mockProjectMemberFindFirstResponse,
//             isDeleted: true,
//         };
//
//         jest.spyOn(
//             prismaService.projectMember,
//             'findFirst',
//         ).mockResolvedValue(mockProjectMemberFindFirstResponse);
//
//         jest.spyOn(prismaService.projectMember, 'update').mockResolvedValue(
//             mockProjectMemberUpdateResponse,
//         );
//
//         const result = await service.cancelApplication(1, mockUser.id);
//
//         expect(result).toBeDefined();
//         expect(result.id).toBe(1);
//         expect(result.status).toBe('PENDING');
//         expect(result.userName).toBe('Test User');
//     });
//
//     it('should throw error if no pending application exists', async () => {
//         jest.spyOn(
//             prismaService.projectMember,
//             'findFirst',
//         ).mockResolvedValue(null);
//
//         await expect(
//             service.cancelApplication(1, mockUser.id),
//         ).rejects.toThrow('취소할 수 있는 지원 내역이 없습니다.');
//     });
// });
//
// // describe('getApplicants', () => {
// //     it('should get project applicants successfully', async () => {
// //         const mockApplicant = {
// //             id: 1,
// //             projectTeamId: 1,
// //             userId: mockUser.id,
// //             isDeleted: false,
// //             createdAt: new Date(),
// //             updatedAt: new Date(),
// //             status: 'PENDING' as StatusCategory,
// //             isLeader: false,
// //             teamRole: 'Frontend',
// //             summary: 'Test application',
// //             user: {
// //                 id: mockUser.id,
// //                 name: 'Test User',
// //                 profileImage: 'https://example.com/profile.jpg',
// //                 createdAt: new Date(),
// //                 updatedAt: new Date(),
// //             },
// //         };
// //
// //         jest.spyOn(
// //             service,
// //             'ensureUserIsProjectMember',
// //         ).mockResolvedValue();
// //         jest.spyOn(
// //             prismaService.projectMember,
// //             'findMany',
// //         ).mockResolvedValue([mockApplicant]);
// //
// //         const result = await service.getApplicants(1, mockUser.id);
// //
// //         expect(result).toBeDefined();
// //         expect(result.length).toBeGreaterThan(0);
// //     });
// // });
//
// // describe('acceptApplicant', () => {
// //     it('should accept project applicant successfully', async () => {
// //         // 1. 지원자 상태가 PENDING 임을 mock 설정
// //         (
// //             projectMemberRepository.getApplicantStatus as jest.Mock
// //         ).mockResolvedValue('PENDING');
//
// //         // 2. 승인 처리 후 반환될 지원자 객체 mock 생성
// //         const updatedApplicant = {
// //             id: 1,
// //             projectTeamId: 1,
// //             userId: mockUser.id,
// //             isDeleted: false,
// //             createdAt: new Date(),
// //             updatedAt: new Date(),
// //             status: 'APPROVED',
// //             isLeader: false,
// //             teamRole: 'Frontend',
// //             summary: 'Test application',
// //             user: {
// //                 id: mockUser.id,
// //                 email: mockUser.email,
// //                 name: 'Test User',
// //                 profileImage: 'https://example.com/profile.jpg',
// //                 createdAt: new Date(),
// //                 updatedAt: new Date(),
// //             },
// //         };
//
// //         // 3. updateApplicantStatus 메서드가 승인된 지원자 객체를 반환하도록 mock 설정
// //         (
// //             projectMemberRepository.updateApplicantStatus as jest.Mock
// //         ).mockResolvedValue(updatedApplicant);
//
// //         // 4. 테스트 실행: projectTeamId: 1, memberId: mockUser.id, applicantId: 2
// //         const result = await service.acceptApplicant(1, mockUser.id, 2);
//
// //         // 5. 결과 검증
// //         expect(result).toBeDefined();
// //         expect(result.status).toBe('APPROVED');
// //         expect(service.ensureUserIsProjectMember).toHaveBeenCalledWith(
// //             1,
// //             mockUser.id,
// //         );
// //         expect(
// //             projectMemberRepository.getApplicantStatus as jest.Mock,
// //         ).toHaveBeenCalledWith(1, 2);
// //         expect(
// //             projectMemberRepository.updateApplicantStatus as jest.Mock,
// //         ).toHaveBeenCalledWith(1, 2, 'APPROVED');
// //         // private 메서드 접근은 (service as any)로
// //         expect((service as any).sendProjectUserAlert).toHaveBeenCalledWith(
// //             1,
// //             updatedApplicant.user.email,
// //             'APPROVED',
// //         );
// //     });
//
// //     it('should throw AlreadyApprovedException if applicant already approved', async () => {
// //         // 지원자 상태가 이미 APPROVED인 경우
// //         (
// //             projectMemberRepository.getApplicantStatus as jest.Mock
// //         ).mockResolvedValue('APPROVED');
//
// //         await expect(
// //             service.acceptApplicant(1, mockUser.id, 2),
// //         ).rejects.toBeInstanceOf(AlreadyApprovedException);
// //         expect(service.ensureUserIsProjectMember).toHaveBeenCalledWith(
// //             1,
// //             mockUser.id,
// //         );
// //         expect(
// //             projectMemberRepository.getApplicantStatus as jest.Mock,
// //         ).toHaveBeenCalledWith(1, 2);
// //         // updateApplicantStatus와 sendProjectUserAlert는 호출되지 않아야 함
// //         expect(
// //             projectMemberRepository.updateApplicantStatus as jest.Mock,
// //         ).not.toHaveBeenCalled();
// //         expect(
// //             (service as any).sendProjectUserAlert,
// //         ).not.toHaveBeenCalled();
// //     });
// // });
//
// describe('rejectApplicant', () => {
//     it('should reject project applicant successfully', async () => {
//         const mockApplicant = {
//             id: 1,
//             projectTeamId: 1,
//             userId: mockUser.id,
//             isDeleted: false,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             status: 'REJECT' as StatusCategory,
//             isLeader: false,
//             teamRole: 'Frontend',
//             summary: 'Test application',
//             user: {
//                 id: mockUser.id,
//                 name: 'Test User',
//                 profileImage: 'https://example.com/profile.jpg',
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//             },
//         };
//
//         jest.spyOn(service, 'ensureUserIsProjectMember').mockResolvedValue(
//             undefined,
//         );
//         (
//             projectMemberRepository.getApplicantStatus as jest.Mock
//         ).mockResolvedValue('PENDING');
//         (
//             projectMemberRepository.updateApplicantStatus as jest.Mock
//         ).mockResolvedValue(mockApplicant);
//
//         const result = await service.rejectApplicant(1, mockUser.id, 2);
//
//         expect(result).toBeDefined();
//         expect(result.status).toBe('REJECT');
//     });
// });
//
// describe('getAllTeams', () => {
//     it('should get all teams successfully', async () => {
//         const mockProjectTeams = [
//             {
//                 ...mockProjectTeamResponse,
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//                 isDeleted: false,
//                 mainImages: [{ imageUrl: 'https://test.com/image.jpg' }],
//                 teamStacks: [
//                     {
//                         stack: { name: 'React.js' },
//                         isMain: true,
//                     },
//                 ],
//                 githubLink: 'https://github.com/test',
//                 notionLink: 'https://notion.so/test',
//                 recruitExplain: 'Test recruit explain',
//                 frontendNum: 1,
//                 backendNum: 1,
//                 devopsNum: 0,
//                 fullStackNum: 0,
//                 dataEngineerNum: 0,
//             },
//         ];
//
//         const mockStudyTeams = [
//             {
//                 id: 2,
//                 name: 'Test Study',
//                 githubLink: 'https://github.com/test',
//                 notionLink: 'https://notion.so/test',
//                 goal: 'test goal',
//                 rule: 'test rule',
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//                 isDeleted: false,
//                 isRecruited: true,
//                 isFinished: false,
//                 recruitNum: 5,
//                 studyExplain: 'Test study explain',
//                 studyMember: [
//                     {
//                         userId: 1,
//                         isLeader: true,
//                     },
//                 ],
//                 recruitExplain: 'Test recruit explain',
//                 likeCount: 0,
//                 viewCount: 0,
//             },
//         ];
//
//         jest.spyOn(prismaService.projectTeam, 'findMany').mockResolvedValue(
//             mockProjectTeams,
//         );
//         jest.spyOn(prismaService.studyTeam, 'findMany').mockResolvedValue(
//             mockStudyTeams,
//         );
//         const mockResult = { projectTeams: [mockProjectTeamResponse] };
//         jest.spyOn(service, 'getAllTeams').mockResolvedValue(mockResult);
//
//         const result = await service.getAllTeams({});
//
//         expect(result).toBeDefined();
//         expect(result.projectTeams).toBeDefined();
//     });
// });
//
// // describe('uploadImagesToS3', () => {
// //     it('should upload images successfully', async () => {
// //         const mockFiles: Express.Multer.File[] = [
// //             {
// //                 ...mockFile,
// //                 originalname: 'test1.jpg',
// //             },
// //             {
// //                 ...mockFile,
// //                 originalname: 'test2.png',
// //             },
// //         ];
// //
// //         jest.spyOn(awsService, 'imageUploadToS3').mockResolvedValue(
// //             'https://test.com/image.jpg',
// //         );
// //
// //         const result = await service.uploadImagesToS3(
// //             mockFiles,
// //             'project-teams',
// //         );
// //
// //         expect(result).toBeDefined();
// //         expect(result.length).toBe(2);
// //         expect(awsService.imageUploadToS3).toHaveBeenCalledTimes(2);
// //     });
// //
// //     it('should throw error for invalid file extension', async () => {
// //         const mockFiles: Express.Multer.File[] = [
// //             {
// //                 ...mockFile,
// //                 originalname: 'test.txt',
// //             },
// //         ];
// //
// //         await expect(
// //             service.uploadImagesToS3(mockFiles, 'project-teams'),
// //         ).rejects.toThrow('허용되지 않은 파일 확장자입니다.');
// //     });
// // });
//
// describe('ensureUserIsProjectMember', () => {
//     it('should allow user who is a project member', async () => {
//         jest.spyOn(
//             projectTeamRepository,
//             'isUserMemberOfProject',
//         ).mockResolvedValue(true);
//
//         await expect(
//             service.ensureUserIsProjectMember(1, mockUser.id),
//         ).resolves.toBeUndefined();
//     });
//
//     it('should throw error for user not in project', async () => {
//         jest.spyOn(
//             projectTeamRepository,
//             'isUserMemberOfProject',
//         ).mockResolvedValue(false);
//         jest.spyOn(service, 'ensureUserIsProjectMember').mockRejectedValue(
//             new Error('사용자가 프로젝트 멤버가 아닙니다.'),
//         );
//
//         await expect(
//             service.ensureUserIsProjectMember(1, mockUser.id),
//         ).rejects.toThrow('사용자가 프로젝트 멤버가 아닙니다.');
//     });
// });
//
// describe('validateStacks', () => {
//     it('should validate stacks successfully', async () => {
//         const teamStacks = [
//             {
//                 stack: 'React.js',
//                 isMain: true,
//             },
//             {
//                 stack: 'Node.js',
//                 isMain: false,
//             },
//         ];
//
//         jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue([
//             {
//                 id: 1,
//                 name: 'React.js',
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//                 isDeleted: false,
//                 category: 'FRONTEND' as StackCategory,
//             },
//             {
//                 id: 2,
//                 name: 'Node.js',
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//                 isDeleted: false,
//                 category: 'BACKEND' as StackCategory,
//             },
//         ]);
//
//         const result = await (service as any).validateStacks(teamStacks);
//
//         expect(result).toBeDefined();
//         expect(result.length).toBe(2);
//     });
//
//     it('should throw error for invalid stacks', async () => {
//         const teamStacks = [
//             {
//                 stack: 'Invalid Stack',
//                 isMain: true,
//             },
//         ];
//
//         jest.spyOn(prismaService.stack, 'findMany').mockResolvedValue([]);
//
//         await expect(
//             (service as any).validateStacks(teamStacks),
//         ).rejects.toThrow('유효하지 않은 스택 이름이 포함되어 있습니다.');
//     });
// });
//
// describe('mapStackData', () => {
//     it('should map stack data correctly', async () => {
//         const teamStacks = [
//             {
//                 stack: 'React.js',
//                 isMain: true,
//             },
//         ];
//         const validStacks = [
//             {
//                 id: 1,
//                 name: 'React.js',
//             },
//         ];
//
//         const result = (service as any).mapStackData(
//             teamStacks,
//             validStacks,
//         );
//
//         expect(result).toBeDefined();
//         expect(result[0]).toEqual({
//             stackId: 1,
//             isMain: true,
//         });
//     });
//
//     it('should throw error for unmatched stack', () => {
//         const teamStacks = [
//             {
//                 stack: 'React.js',
//                 isMain: true,
//             },
//         ];
//         const validStacks = [
//             {
//                 id: 1,
//                 name: 'Node.js',
//             },
//         ];
//
//         expect(() =>
//             (service as any).mapStackData(teamStacks, validStacks),
//         ).toThrow('스택(React.js)을 찾을 수 없습니다.');
//     });
// });
//
// describe('addMemberToProjectTeam', () => {
//     it('should add member to project team successfully', async () => {
//         jest.spyOn(
//             projectTeamRepository,
//             'isUserExists',
//         ).mockImplementation((id) =>
//             Promise.resolve(id === mockUser.id || id === 2),
//         );
//
//         const mockNewMember = {
//             id: 3,
//             projectTeamId: 1,
//             userId: 2,
//             isLeader: false,
//             teamRole: 'Backend',
//             status: 'APPROVED' as StatusCategory,
//             user: {
//                 name: 'New Member',
//                 profileImage: 'https://example.com/profile.jpg',
//             },
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             isDeleted: false,
//             summary: 'New member added successfully',
//         };
//
//         jest.spyOn(
//             projectMemberRepository,
//             'addMemberToProjectTeam',
//         ).mockResolvedValue(mockNewMember);
//
//         const result = await service.addMemberToProjectTeam(
//             1,
//             mockUser.id,
//             2,
//             false,
//             'Backend',
//         );
//
//         expect(result).toBeDefined();
//         expect(result.userId).toBe(2);
//         expect(result.teamRole).toBe('Backend');
//     });
// });
//
// describe('closeProject', () => {
//     it('should close project successfully', async () => {
//         const mockClosedProject = {
//             ...mockProjectTeamResponse,
//             isRecruited: false,
//         };
//
//         jest.spyOn(service, 'closeProject').mockResolvedValue(
//             mockClosedProject,
//         );
//
//         const result = await service.closeProject(1, mockUser.id);
//
//         expect(result).toBeDefined();
//         expect(result.isRecruited).toBe(false);
//     });
// });
//
// describe('deleteProject', () => {
//     it('should delete project successfully', async () => {
//         const mockDeletedProject = {
//             ...mockProjectTeamResponse,
//             isDeleted: true,
//         };
//
//         jest.spyOn(service, 'deleteProject').mockResolvedValue(
//             mockDeletedProject,
//         );
//
//         const result = await service.deleteProject(1, mockUser.id);
//
//         expect(result).toBeDefined();
//         expect(result.isDeleted).toBe(true);
//     });
// });
//
// describe('getProjectTeamMembersById', () => {
//     it('should get project team members successfully', async () => {
//         const mockProjectMembers = [
//             {
//                 id: 1,
//                 projectTeamId: 1,
//                 userId: mockUser.id,
//                 isLeader: true,
//                 teamRole: 'Frontend',
//                 status: 'APPROVED' as StatusCategory,
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//                 isDeleted: false,
//                 summary: 'Test project member summary',
//                 user: {
//                     name: 'Test User',
//                     profileImage: 'https://example.com/profile.jpg',
//                 },
//             },
//         ];
//
//         jest.spyOn(
//             prismaService.projectMember,
//             'findMany',
//         ).mockResolvedValue(mockProjectMembers);
//
//         const result = await service.getProjectTeamMembersById(1);
//
//         expect(result).toBeDefined();
//         expect(result.length).toBeGreaterThan(0);
//     });
//
//     it('should throw error if no project found', async () => {
//         jest.spyOn(
//             prismaService.projectMember,
//             'findMany',
//         ).mockResolvedValue([]);
//         jest.spyOn(service, 'getProjectTeamMembersById').mockRejectedValue(
//             new NotFoundProjectException(),
//         );
//
//         await expect(
//             service.getProjectTeamMembersById(999),
//         ).rejects.toThrow(NotFoundProjectException);
//     });
