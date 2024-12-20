import { StudyTeamRepository } from '../repository/studyTeam.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
    mockStudyTeam1,
    mockUser1,
    mockUser2,
    mockCreateStudyTeamRequest,
    mockStudyTeamWithMembers,
} from './mock-data';


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
            jest.spyOn(prismaService.studyTeam, 'create').mockResolvedValueOnce(
                mockStudyTeam1,
            );

            const result = await studyTeamRepository.createStudyTeam(
                mockCreateStudyTeamRequest,
            );

            expect(result).toEqual({
                id: 1,
                ...mockStudyTeam1,
            });
            expect(prismaService.studyTeam.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ name: 'Test Study' }),
                include: {
                    studyMember: true,
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
            jest.spyOn(prismaService.studyTeam, 'update').mockResolvedValueOnce(
                {
                    ...mockStudyTeam1,
                    name: 'Test Study',
                },
            );
    
            const result = await studyTeamRepository.updateStudyTeam(1, {
                name: 'Test Study',
            });
    
            // 방법 1: 모든 속성을 명시적으로 검증
            expect(result).toEqual({
                id: 1,
                name: 'Test Study',
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
                isDeleted: false,
                isFinished: false,
                isRecruited: true,
                githubLink: 'https://github.com/test',
                notionLink: 'https://notion.so/test',
                studyExplain: 'This is a test study',
                goal: 'Learn TypeScript',
                rule: 'Follow best practices',
                recruitNum: 5,
                recruitExplain: 'Looking for dedicated learners',
            });
    
            // 방법 2: 부분적 속성만 검증
            expect(result).toMatchObject({
                id: 1,
                name: 'Test Study',
            });
    
            // Prisma의 update 호출을 검증
            expect(prismaService.studyTeam.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: expect.objectContaining({ name: 'Test Study' }),
                include: {
                    resultImages: { where: { isDeleted: false } },
                    studyMember: { where: { isDeleted: false } },
                },
            });
        });
    });

    describe('closeStudyTeam', () => {
        it('should successfully close the study team', async () => {
            jest.spyOn(prismaService.studyTeam, 'update').mockResolvedValueOnce(
                mockStudyTeam1,
            );

            const result = await studyTeamRepository.closeStudyTeam(1);

            expect(result).toEqual(mockStudyTeam1);
            expect(prismaService.studyTeam.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { isRecruited: false },
                include: {
                    resultImages: { where: { isDeleted: false } },
                    studyMember: { where: { isDeleted: false } },
                },
            });
        });
    });

    describe('deleteStudyTeam', () => {
        it('should successfully delete the study team', async () => {
            jest.spyOn(prismaService.studyTeam, 'update').mockResolvedValueOnce(
                mockStudyTeam1,
            );

            const result = await studyTeamRepository.deleteStudyTeam(1);

            expect(result).toEqual(mockStudyTeam1);
            expect(prismaService.studyTeam.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { isDeleted: true },
                include: {
                    resultImages: { where: { isDeleted: false } },
                    studyMember: { where: { isDeleted: false } },
                },
            });
        });
    });

    describe('getUserStudyTeams', () => {
        it('should return a list of study teams the user is part of', async () => {
            jest.spyOn(
                prismaService.studyTeam,
                'findMany',
            ).mockResolvedValueOnce([mockStudyTeam1]);

            const result = await studyTeamRepository.getUserStudyTeams(1);

            expect(result).toEqual([
                {
                    ...mockStudyTeam1,
                    resultImages: [],
                    studyMember: [],
                }
            ]);
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
                        select: { imageUrl: true },
                    },
                    studyMember: {
                        where: {
                            isDeleted: false,
                            status: 'APPROVED',
                        },
                        select: { user: { select: { name: true } } },
                    },
                },
            });
        });
    });

    describe('getStudyTeamMembersById', () => {
        it('should return the members of a study team by its ID', async () => {
            jest.spyOn(
                prismaService.studyTeam,
                'findUnique',
            ).mockResolvedValueOnce(mockStudyTeamWithMembers);
            const result = await studyTeamRepository.getStudyTeamMembersById(1);

            expect(result).toEqual({
                studyName: 'Test Study',
                members: [
                    {
                        name: 'User 1',
                        year: 2022,
                    },
                    {
                        name: 'User 2',
                        year: 2023,
                    },
                ],
            });
            expect(prismaService.studyTeam.findUnique).toHaveBeenCalledWith({
                where: {
                    id: 1,
                    isDeleted: false,
                },
                select: {
                    name: true,
                    studyMember: {
                        where: { isDeleted: false },
                        select: {
                            user: {
                                select: {
                                    name: true,
                                    year: true,
                                },
                            },
                        },
                    },
                },
            });
        });
    });
});
