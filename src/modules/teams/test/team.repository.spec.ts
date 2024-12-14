import { Test, TestingModule } from '@nestjs/testing';
import { TeamRepository } from '../repository/team.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeamRequest } from '../dto/request/create.team.request';
import { Team } from '@prisma/client';

describe('TeamRepository', () => {
    let repository: TeamRepository;
    let prismaService: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TeamRepository,
                {
                    provide: PrismaService,
                    useValue: {
                        team: {
                            create: jest.fn(),
                            findUnique: jest.fn(),
                            update: jest.fn(),
                            delete: jest.fn(),
                            findMany: jest.fn(),
                        },
                        teamStack: {
                            createMany: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        repository = module.get<TeamRepository>(TeamRepository);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('createAnnouncement', () => {
        it('should create an announcement and associate stacks', async () => {
            const dto: CreateTeamRequest = {
                name: 'Test Team',
                category: 'Test Category',
                isRecruited: true,
                isFinished: false,
                stacks: [1, 2, 3],
            };
            const newAnnouncement = {
                id: 1,
                name: 'Test Team',
                category: 'Test Category',
                isRecruited: true,
                isFinished: false,
            };

            jest.spyOn(prismaService.team, 'create').mockResolvedValue(
                newAnnouncement as Team,
            );
            jest.spyOn(prismaService.teamStack, 'createMany').mockResolvedValue(
                undefined,
            );

            const result = await repository.createTeam(dto);

            expect(result).toEqual(newAnnouncement);
            expect(prismaService.team.create).toHaveBeenCalledWith({
                data: {
                    name: dto.name,
                    category: dto.category,
                    isRecruited: dto.isRecruited,
                    isFinished: dto.isFinished,
                },
            });
            expect(prismaService.teamStack.createMany).toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    {
                        teamId: newAnnouncement.id,
                        stackId: 1,
                    },
                    {
                        teamId: newAnnouncement.id,
                        stackId: 2,
                    },
                    {
                        teamId: newAnnouncement.id,
                        stackId: 3,
                    },
                ]),
            });
        });
    });

    describe('findAnnouncementById', () => {
        it('should return the announcement by ID', async () => {
            const announcementId = 1;
            const announcement = {
                id: announcementId,
                name: 'Test Team',
                category: 'Test Category',
            };

            jest.spyOn(prismaService.team, 'findUnique').mockResolvedValue(
                announcement as Team,
            );

            const result =
                await repository.findAnnouncementById(announcementId);

            expect(result).toEqual(announcement);
            expect(prismaService.team.findUnique).toHaveBeenCalledWith({
                where: { id: announcementId },
                include: {
                    teamStacks: {
                        include: {
                            stack: true,
                        },
                    },
                    teamMembers: {
                        include: {
                            user: true,
                        },
                    },
                },
            });
        });
    });

    describe('updateAnnouncement', () => {
        it('should update an announcement', async () => {
            const announcementId = 1;
            const updateData = { name: 'Updated Team Name' };
            const updatedAnnouncement = {
                id: announcementId,
                ...updateData,
                category: 'Test Category',
            };

            jest.spyOn(prismaService.team, 'update').mockResolvedValue(
                updatedAnnouncement as Team,
            );

            const result = await repository.updateAnnouncement(
                announcementId,
                updateData,
            );

            expect(result).toEqual(updatedAnnouncement);
            expect(prismaService.team.update).toHaveBeenCalledWith({
                where: { id: announcementId },
                data: updateData,
            });
        });
    });

    describe('deleteAnnouncement', () => {
        it('should delete an announcement', async () => {
            const announcementId = 1;
            const deletedAnnouncement = {
                id: announcementId,
                name: 'Test Team',
                category: 'Test Category',
            };

            jest.spyOn(prismaService.team, 'delete').mockResolvedValue(
                deletedAnnouncement as Team,
            );

            const result = await repository.deleteAnnouncement(announcementId);

            expect(result).toEqual(deletedAnnouncement);
            expect(prismaService.team.delete).toHaveBeenCalledWith({
                where: { id: announcementId },
            });
        });
    });

    describe('closeAnnouncement', () => {
        it('should close an announcement', async () => {
            const announcementId = 1;
            const closedAnnouncement = {
                id: announcementId,
                name: 'Test Team',
                isRecruited: false,
            };

            jest.spyOn(prismaService.team, 'update').mockResolvedValue(
                closedAnnouncement as Team,
            );

            const result = await repository.closeAnnouncement(announcementId);

            expect(result).toEqual(closedAnnouncement);
            expect(prismaService.team.update).toHaveBeenCalledWith({
                where: { id: announcementId },
                data: { isRecruited: false },
            });
        });
    });

    describe('getAllTeams', () => {
        it('should return all teams', async () => {
            const offset = 0;
            const limit = 10;
            const teams = [
                {
                    id: 1,
                    name: 'Team A',
                    category: 'Category A',
                },
            ];

            jest.spyOn(prismaService.team, 'findMany').mockResolvedValue(
                teams as Team[],
            );

            const result = await repository.getAllTeams(offset, limit);

            expect(result).toEqual(teams);
            expect(prismaService.team.findMany).toHaveBeenCalledWith({
                where: { isDeleted: false },
                include: {
                    teamStacks: {
                        include: {
                            stack: true,
                        },
                    },
                    teamMembers: {
                        include: {
                            user: true,
                        },
                    },
                },
                skip: offset,
                take: limit,
            });
        });
    });

    describe('getMyProjects', () => {
        it('should return projects for a user', async () => {
            const userId = 1;
            const offset = 0;
            const limit = 10;
            const projects = [
                {
                    id: 1,
                    name: 'Project A',
                    category: 'Category A',
                },
            ];

            jest.spyOn(prismaService.team, 'findMany').mockResolvedValue(
                projects as Team[],
            );

            const result = await repository.getMyProjects(
                userId,
                offset,
                limit,
            );

            expect(result).toEqual(projects);
            expect(prismaService.team.findMany).toHaveBeenCalledWith({
                where: {
                    isDeleted: false,
                    teamMembers: {
                        some: {
                            userId: userId,
                        },
                    },
                },
                include: {
                    teamStacks: {
                        include: {
                            stack: true,
                        },
                    },
                    teamMembers: {
                        include: {
                            user: true,
                        },
                    },
                },
                skip: offset,
                take: limit,
            });
        });
    });
});
