import { ProjectTeamRepository } from '../repository/projectTeam.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { mockProjectTeamResponse, mockUserResponse } from './mock-data';
import { StatusCategory } from '@prisma/client';

describe('ProjectTeamRepository', () => {
    let projectTeamRepository: ProjectTeamRepository;
    let prismaService: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProjectTeamRepository,
                {
                    provide: PrismaService,
                    useValue: {
                        projectTeam: {
                            findUnique: jest.fn(),
                        },
                        projectMember: {
                            findFirst: jest.fn(),
                        },
                        user: {
                            findUnique: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        projectTeamRepository = module.get<ProjectTeamRepository>(
            ProjectTeamRepository,
        );
        prismaService = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findProjectByName', () => {
        it('should return true if a project with the given name exists', async () => {
            jest.spyOn(
                prismaService.projectTeam,
                'findUnique',
            ).mockResolvedValueOnce(mockProjectTeamResponse);

            const result =
                await projectTeamRepository.findProjectByName('Test Project');

            expect(result).toBe(true);
            expect(prismaService.projectTeam.findUnique).toHaveBeenCalledWith({
                where: { name: 'Test Project' },
            });
        });

        it('should return false if no project with the given name exists', async () => {
            jest.spyOn(
                prismaService.projectTeam,
                'findUnique',
            ).mockResolvedValueOnce(null);

            const result = await projectTeamRepository.findProjectByName(
                'Non Existent Project',
            );

            expect(result).toBe(false);
            expect(prismaService.projectTeam.findUnique).toHaveBeenCalledWith({
                where: { name: 'Non Existent Project' },
            });
        });
    });

    describe('isUserMemberOfProject', () => {
        it('should return true if user is a member of the project', async () => {
            jest.spyOn(
                prismaService.projectMember,
                'findFirst',
            ).mockResolvedValueOnce({
                id: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                projectTeamId: 1,
                isLeader: false,
                teamRole: 'Frontend',
                userId: 1,
                summary: '프론트엔드 개발자입니다.',
                status: 'APPROVED' as StatusCategory,
            });

            const result = await projectTeamRepository.isUserMemberOfProject(
                1,
                1,
            );

            expect(result).toBe(true);
            expect(prismaService.projectMember.findFirst).toHaveBeenCalledWith({
                where: {
                    projectTeamId: 1,
                    userId: 1,
                    isDeleted: false,
                },
                select: { id: true },
            });
        });

        it('should return false if user is not a member of the project', async () => {
            jest.spyOn(
                prismaService.projectMember,
                'findFirst',
            ).mockResolvedValueOnce(null);

            const result = await projectTeamRepository.isUserMemberOfProject(
                1,
                2,
            );

            expect(result).toBe(false);
            expect(prismaService.projectMember.findFirst).toHaveBeenCalledWith({
                where: {
                    projectTeamId: 1,
                    userId: 2,
                    isDeleted: false,
                },
                select: { id: true },
            });
        });
    });

    describe('isUserExists', () => {
        it('should return true if user exists', async () => {
            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(
                mockUserResponse,
            );

            const result = await projectTeamRepository.isUserExists(1);

            expect(result).toBe(true);
            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
            });
        });

        it('should return false if user does not exist', async () => {
            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(
                null,
            );

            const result = await projectTeamRepository.isUserExists(999);

            expect(result).toBe(false);
            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: { id: 999 },
            });
        });
    });
});
