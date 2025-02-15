import { StudyTeamRepository } from '../repository/studyTeam.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
    mockStudyTeam1,
    mockUser1,
    mockUser2,
    mockCreateStudyTeamRequest,
} from './mock-data';
import { GetStudyTeamResponse } from '../dto/response/get.studyTeam.response';
import { StatusCategory } from '@prisma/client';

describe('StudyTeamRepository', () => {
    let studyTeamRepository: StudyTeamRepository;
    let prismaService: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StudyTeamRepository,
                {
                    provide: PrismaService,
                    useValue: {
                        studyTeam: {
                            findUnique: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                            findMany: jest.fn(),
                        },
                        studyMember: {
                            findFirst: jest.fn(),
                            create: jest.fn(),
                            updateMany: jest.fn(),
                            findMany: jest.fn(),
                        },
                        user: {
                            findMany: jest.fn(),
                        },
                        studyResultImage: {
                            updateMany: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        studyTeamRepository =
            module.get<StudyTeamRepository>(StudyTeamRepository);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findStudyByName', () => {
        it('should return true if a study with the given name exists', async () => {
            jest.spyOn(
                prismaService.studyTeam,
                'findUnique',
            ).mockResolvedValueOnce(mockStudyTeam1);

            const result =
                await studyTeamRepository.findStudyByName('Test Study');

            expect(result).toBe(true);
            expect(prismaService.studyTeam.findUnique).toHaveBeenCalledWith({
                where: { name: 'Test Study' },
            });
        });

        it('should return false if no study with the given name exists', async () => {
            jest.spyOn(
                prismaService.studyTeam,
                'findUnique',
            ).mockResolvedValueOnce(null);

            const result =
                await studyTeamRepository.findStudyByName('Non Existent Study');

            expect(result).toBe(false);
            expect(prismaService.studyTeam.findUnique).toHaveBeenCalledWith({
                where: { name: 'Non Existent Study' },
            });
        });
    });

    describe('createStudyTeam', () => {
        it('should create a study team successfully', async () => {
            const mockCreatedStudyTeam = {
                ...mockStudyTeam1,
                resultImages: mockCreateStudyTeamRequest.resultImages.map(
                    (imageUrl) => ({
                        imageUrl,
                        id: 1,
                        createdAt: new Date('2025-02-14T16:20:16.816Z'),
                        updatedAt: new Date('2025-02-14T16:20:16.816Z'),
                        isDeleted: false,
                        studyTeamId: 1,
                    }),
                ),
                studyMember: mockCreateStudyTeamRequest.studyMember.map(
                    (member) => ({
                        id: 1,
                        createdAt: new Date('2025-02-14T16:20:16.816Z'),
                        updatedAt: new Date('2025-02-14T16:20:16.816Z'),
                        isDeleted: false,
                        studyTeamId: 1,
                        summary: '초기 참여 인원입니다',
                        status: 'APPROVED' as StatusCategory,
                        userId: member.userId,
                        isLeader: member.isLeader,
                        user: {
                            id: member.userId,
                            name: 'Test User',
                        },
                    }),
                ),
            };

            jest.spyOn(prismaService.studyTeam, 'create').mockResolvedValueOnce(
                mockCreatedStudyTeam as any,
            );

            const result = await studyTeamRepository.createStudyTeam(
                mockCreateStudyTeamRequest,
            );

            expect(result).toEqual(
                new GetStudyTeamResponse(mockCreatedStudyTeam as any),
            );
            expect(prismaService.studyTeam.create).toHaveBeenCalledWith({
                data: {
                    name: mockCreateStudyTeamRequest.name,
                    githubLink: mockCreateStudyTeamRequest.githubLink,
                    notionLink: mockCreateStudyTeamRequest.notionLink,
                    studyExplain: mockCreateStudyTeamRequest.studyExplain,
                    goal: mockCreateStudyTeamRequest.goal,
                    rule: mockCreateStudyTeamRequest.rule,
                    recruitNum: mockCreateStudyTeamRequest.recruitNum,
                    recruitExplain: mockCreateStudyTeamRequest.recruitExplain,
                    createdAt: expect.any(Date),
                    updatedAt: expect.any(Date),
                    isDeleted: false,
                    isRecruited: true,
                    isFinished: false,
                    studyMember: {
                        create: mockCreateStudyTeamRequest.studyMember.map(
                            (member) => ({
                                status: 'APPROVED',
                                summary: '초기 참여 인원입니다',
                                user: {
                                    connect: { id: member.userId },
                                },
                                isLeader: member.isLeader,
                            }),
                        ),
                    },
                    resultImages: {
                        create: mockCreateStudyTeamRequest.resultImages.map(
                            (imageUrl) => ({
                                imageUrl,
                            }),
                        ),
                    },
                },
                include: {
                    studyMember: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                    resultImages: true,
                },
            });
        });
    });

    describe('checkExistUsers', () => {
        it('should return a list of existing user IDs', async () => {
            jest.spyOn(prismaService.user, 'findMany').mockResolvedValueOnce([
                mockUser1,
                mockUser2,
            ]);

            const result = await studyTeamRepository.checkExistUsers([1, 2, 3]);

            expect(result).toEqual([1, 2]);
            expect(prismaService.user.findMany).toHaveBeenCalledWith({
                where: { id: { in: [1, 2, 3] } },
            });
        });
    });

    describe('deleteImages', () => {
        it('should mark images as deleted', async () => {
            jest.spyOn(
                prismaService.studyResultImage,
                'updateMany',
            ).mockResolvedValueOnce({
                count: 2,
            });

            await studyTeamRepository.deleteImages([1, 2]);

            expect(
                prismaService.studyResultImage.updateMany,
            ).toHaveBeenCalledWith({
                where: { id: { in: [1, 2] } },
                data: { isDeleted: true },
            });
        });
    });

    describe('deleteMembers', () => {
        it('should mark members as deleted', async () => {
            jest.spyOn(
                prismaService.studyMember,
                'updateMany',
            ).mockResolvedValueOnce({
                count: 2,
            });

            await studyTeamRepository.deleteMembers([1, 2]);

            expect(prismaService.studyMember.updateMany).toHaveBeenCalledWith({
                where: { id: { in: [1, 2] } },
                data: { isDeleted: true },
            });
        });
    });

    describe('updateStudyTeam', () => {
        it('should update the study team successfully', async () => {
            const mockUpdatedStudyTeam = {
                ...mockStudyTeam1,
                name: 'Updated Test Study',
                resultImages: [],
                studyMember: [],
            };

            jest.spyOn(prismaService.studyTeam, 'update').mockResolvedValueOnce(
                mockUpdatedStudyTeam,
            );

            const updateRequest = {
                name: 'Updated Test Study',
            };

            const result = await studyTeamRepository.updateStudyTeam(
                1,
                updateRequest,
            );

            expect(result).toEqual(
                new GetStudyTeamResponse(mockUpdatedStudyTeam),
            );
            expect(prismaService.studyTeam.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: expect.objectContaining(updateRequest),
                include: {
                    resultImages: true,
                    studyMember: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });
        });
    });

    describe('closeStudyTeam', () => {
        it('should successfully close the study team', async () => {
            const mockClosedStudyTeam = {
                ...mockStudyTeam1,
                isRecruited: false,
                resultImages: [],
                studyMember: [],
            };

            jest.spyOn(prismaService.studyTeam, 'update').mockResolvedValueOnce(
                mockClosedStudyTeam,
            );

            const result = await studyTeamRepository.closeStudyTeam(1);

            expect(result).toEqual(
                new GetStudyTeamResponse(mockClosedStudyTeam),
            );
            expect(prismaService.studyTeam.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { isRecruited: false },
                include: {
                    resultImages: true,
                    studyMember: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });
        });
    });

    describe('deleteStudyTeam', () => {
        it('should successfully delete the study team', async () => {
            const mockDeletedStudyTeam = {
                ...mockStudyTeam1,
                isDeleted: true,
                resultImages: [],
                studyMember: [],
            };

            jest.spyOn(prismaService.studyTeam, 'update').mockResolvedValueOnce(
                mockDeletedStudyTeam,
            );

            const result = await studyTeamRepository.deleteStudyTeam(1);

            expect(result).toEqual(
                new GetStudyTeamResponse(mockDeletedStudyTeam),
            );
            expect(prismaService.studyTeam.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { isDeleted: true },
                include: {
                    resultImages: true,
                    studyMember: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });
        });
    });

    describe('getUserStudyTeams', () => {
        it('should return a list of study teams the user is part of', async () => {
            const mockUserStudyTeams = [
                {
                    ...mockStudyTeam1,
                    resultImages: [
                        {
                            id: 1,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            isDeleted: false,
                            studyTeamId: 1,
                            imageUrl: 'http://example.com/image.jpg',
                        },
                    ],
                    studyMember: [
                        {
                            id: 1,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            isDeleted: false,
                            isLeader: true,
                            studyTeamId: 1,
                            userId: 1,
                            summary: '',
                            status: 'APPROVED' as StatusCategory,
                            user: { name: 'User 1' },
                        },
                    ],
                },
            ];

            jest.spyOn(
                prismaService.studyTeam,
                'findMany',
            ).mockResolvedValueOnce(mockUserStudyTeams);

            const result = await studyTeamRepository.getUserStudyTeams(1);

            expect(result).toEqual(
                mockUserStudyTeams.map(
                    (team) => new GetStudyTeamResponse(team),
                ),
            );
            expect(prismaService.studyTeam.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    studyMember: {
                        some: {
                            userId: 1,
                            isDeleted: false,
                        },
                    },
                },
                include: {
                    resultImages: {
                        where: { isDeleted: false },
                    },
                    studyMember: {
                        where: {
                            isDeleted: false,
                            status: 'APPROVED',
                        },
                        include: {
                            user: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });
        });
    });

    describe('getStudyTeamMembersById', () => {
        it('should return the members of a study team by its ID', async () => {
            const mockStudyTeam = {
                name: 'Test Study',
                studyMember: [
                    {
                        user: { name: 'User 1' },
                        isLeader: true,
                    },
                    {
                        user: { name: 'User 2' },
                        isLeader: false,
                    },
                ],
            };

            jest.spyOn(
                prismaService.studyTeam,
                'findUnique',
            ).mockResolvedValueOnce(mockStudyTeam as any);

            const result = await studyTeamRepository.getStudyTeamMembersById(1);

            expect(result).toEqual([
                {
                    name: 'User 1',
                    isLeader: true,
                },
                {
                    name: 'User 2',
                    isLeader: false,
                },
            ]);

            expect(prismaService.studyTeam.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 1,
                    isDeleted: false,
                },
                include: {
                    studyMember: {
                        where: { isDeleted: false },
                        include: {
                            user: true,
                        },
                    },
                },
            });
        });
    });
});
