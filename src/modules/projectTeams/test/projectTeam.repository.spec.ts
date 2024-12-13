import { Test, TestingModule } from '@nestjs/testing';
import { ProjectTeamRepository } from '../repository/projectTeam.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectTeamRequest } from '../dto/request/create.projectTeam.request';

describe('ProjectTeamRepository', () => {
    let repository: ProjectTeamRepository;
    let prismaService: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProjectTeamRepository,
                {
                    provide: PrismaService,
                    useValue: {
                        projectTeam: {
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

        repository = module.get<ProjectTeamRepository>(ProjectTeamRepository);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('createProjectTeam', () => {
        it('should create a project team and associate stacks', async () => {
            const dto: CreateProjectTeamRequest & { userId: string } = {
                name: 'Test Team',
                projectExplain: 'Test project description',
                frontendNum: 3,
                backendNum: 2,
                devopsNum: 1,
                uiuxNum: 1,
                dataEngineerNum: 1,
                recruitExplain: 'Looking for backend engineers',
                isRecruited: true,
                isFinished: false,
                stacks: [1, 2, 3],
                userId: '123',
            };
            const newAnnouncement = {
                id: 1,
                name: 'Test Team',
                projectExplain: 'Test project description',
                frontendNum: 3,
                backendNum: 2,
                devopsNum: 1,
                uiuxNum: 1,
                dataEngineerNum: 1,
                recruitExplain: 'Looking for backend engineers',
                isRecruited: true,
                isFinished: false,
            };

            jest.spyOn(prismaService.projectTeam, 'create').mockResolvedValue(
                newAnnouncement as any,
            );
            jest.spyOn(prismaService.teamStack, 'createMany').mockResolvedValue(
                undefined,
            );

            const result = await repository.createProjectTeam(dto);

            expect(result).toEqual(newAnnouncement);
            expect(prismaService.projectTeam.create).toHaveBeenCalledWith({
                data: {
                    name: dto.name,
                    projectExplain: dto.projectExplain,
                    frontendNum: dto.frontendNum,
                    backendNum: dto.backendNum,
                    devopsNum: dto.devopsNum,
                    uiuxNum: dto.uiuxNum,
                    dataEngineerNum: dto.dataEngineerNum,
                    recruitExplain: dto.recruitExplain,
                    isRecruited: dto.isRecruited,
                    isFinished: dto.isFinished,
                    userId: dto.userId,
                },
            });
            expect(prismaService.teamStack.createMany).toHaveBeenCalledWith({
                data: [
                    {
                        projectTeamId: newAnnouncement.id,
                        stackId: 1,
                    },
                    {
                        projectTeamId: newAnnouncement.id,
                        stackId: 2,
                    },
                    {
                        projectTeamId: newAnnouncement.id,
                        stackId: 3,
                    },
                ],
            });
        });
    });

    // describe('findAnnouncementById', () => {
    //     it('should return the announcement by ID', async () => {
    //         const announcementId = 1;
    //         const announcement = {
    //             id: announcementId,
    //             name: 'Test Team',
    //             category: 'Test Category',
    //         };
    //
    //         jest.spyOn(
    //             prismaService.projectTeam,
    //             'findUnique',
    //         ).mockResolvedValue(announcement as any);
    //
    //         const result =
    //             await repository.findAnnouncementById(announcementId);
    //
    //         expect(result).toEqual(announcement);
    //         expect(prismaService.projectTeam.findUnique).toHaveBeenCalledWith({
    //             where: { id: announcementId },
    //             include: {
    //                 teamStacks: {
    //                     include: {
    //                         stack: true,
    //                     },
    //                 },
    //                 projectMember: {
    //                     include: {
    //                         user: true,
    //                     },
    //                 },
    //             },
    //         });
    //     });
    // });
    //
    // describe('updateAnnouncement', () => {
    //     it('should update an announcement', async () => {
    //         const announcementId = 1;
    //         const updateData = { name: 'Updated Team Name' };
    //         const updatedAnnouncement = {
    //             id: announcementId,
    //             ...updateData,
    //             category: 'Test Category',
    //         };
    //
    //         jest.spyOn(prismaService.projectTeam, 'update').mockResolvedValue(
    //             updatedAnnouncement as any,
    //         );
    //
    //         const result = await repository.updateAnnouncement(
    //             announcementId,
    //             updateData,
    //         );
    //
    //         expect(result).toEqual(updatedAnnouncement);
    //         expect(prismaService.projectTeam.update).toHaveBeenCalledWith({
    //             where: { id: announcementId },
    //             data: updateData,
    //         });
    //     });
    // });
    //
    // describe('deleteAnnouncement', () => {
    //     it('should delete an announcement', async () => {
    //         const announcementId = 1;
    //         const deletedAnnouncement = {
    //             id: announcementId,
    //             name: 'Test Team',
    //             category: 'Test Category',
    //         };
    //
    //         jest.spyOn(prismaService.projectTeam, 'delete').mockResolvedValue(
    //             deletedAnnouncement as any,
    //         );
    //
    //         const result = await repository.deleteAnnouncement(announcementId);
    //
    //         expect(result).toEqual(deletedAnnouncement);
    //         expect(prismaService.projectTeam.delete).toHaveBeenCalledWith({
    //             where: { id: announcementId },
    //         });
    //     });
    // });
    //
    // describe('closeAnnouncement', () => {
    //     it('should close an announcement', async () => {
    //         const announcementId = 1;
    //         const closedAnnouncement = {
    //             id: announcementId,
    //             name: 'Test Team',
    //             isRecruited: false,
    //         };
    //
    //         jest.spyOn(prismaService.projectTeam, 'update').mockResolvedValue(
    //             closedAnnouncement as any,
    //         );
    //
    //         const result = await repository.closeAnnouncement(announcementId);
    //
    //         expect(result).toEqual(closedAnnouncement);
    //         expect(prismaService.projectTeam.update).toHaveBeenCalledWith({
    //             where: { id: announcementId },
    //             data: { isRecruited: false },
    //         });
    //     });
    // });
    //
    // describe('getAllTeams', () => {
    //     it('should return all projectTeams', async () => {
    //         const offset = 0;
    //         const limit = 10;
    //         const teams = [
    //             {
    //                 id: 1,
    //                 name: 'Team A',
    //                 category: 'Category A',
    //             },
    //         ];
    //
    //         jest.spyOn(prismaService.projectTeam, 'findMany').mockResolvedValue(
    //             teams as any,
    //         );
    //
    //         const result = await repository.getAllTeams(offset, limit);
    //
    //         expect(result).toEqual(teams);
    //         expect(prismaService.projectTeam.findMany).toHaveBeenCalledWith({
    //             where: { isDeleted: false },
    //             include: {
    //                 teamStacks: {
    //                     include: {
    //                         stack: true,
    //                     },
    //                 },
    //                 projectMember: {
    //                     include: {
    //                         user: true,
    //                     },
    //                 },
    //             },
    //             skip: offset,
    //             take: limit,
    //         });
    //     });
    // });
    //
    // describe('getMyProjects', () => {
    //     it('should return projects for a user', async () => {
    //         const userId = 1;
    //         const offset = 0;
    //         const limit = 10;
    //         const projects = [
    //             {
    //                 id: 1,
    //                 name: 'Project A',
    //                 category: 'Category A',
    //             },
    //         ];
    //
    //         jest.spyOn(prismaService.projectTeam, 'findMany').mockResolvedValue(
    //             projects as any,
    //         );
    //
    //         const result = await repository.getMyProjects(
    //             userId,
    //             offset,
    //             limit,
    //         );
    //
    //         expect(result).toEqual(projects);
    //         expect(prismaService.projectTeam.findMany).toHaveBeenCalledWith({
    //             where: {
    //                 isDeleted: false,
    //                 projectMember: {
    //                     some: {
    //                         userId: userId,
    //                     },
    //                 },
    //             },
    //             include: {
    //                 teamStacks: {
    //                     include: {
    //                         stack: true,
    //                     },
    //                 },
    //                 projectMember: {
    //                     include: {
    //                         user: true,
    //                     },
    //                 },
    //             },
    //             skip: offset,
    //             take: limit,
    //         });
    //     });
    // });
});
