import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { TeamRepository } from '../repository/team.repository';
import { CreateAnnouncementRequest } from '../dto/request/create.team.request';

describe('TeamRepository', () => {
    let repository: TeamRepository;
    let prisma: PrismaService;

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
                        },
                        teamStack: {
                            createMany: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        repository = module.get<TeamRepository>(TeamRepository);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    it('should create an announcement', async () => {
        const dto: CreateAnnouncementRequest = {
            name: 'Test',
            category: 'Project',
            isRecruited: true,
            isFinished: false,
            stacks: [1, 2],
        };
        await repository.createAnnouncement(dto);
        expect(prisma.team.create).toHaveBeenCalledWith({
            data: expect.any(Object),
        });
        expect(prisma.teamStack.createMany).toHaveBeenCalledWith({
            data: expect.any(Array),
        });
    });

    it('should find an announcement by ID', async () => {
        const id = 1;
        await repository.findAnnouncementById(id);
        expect(prisma.team.findUnique).toHaveBeenCalledWith({ where: { id } });
    });

    it('should update an announcement', async () => {
        const id = 1;
        const updateData = { name: 'Updated Test' };
        await repository.updateAnnouncement(id, updateData);
        expect(prisma.team.update).toHaveBeenCalledWith({
            where: { id },
            data: expect.any(Object),
        });
    });

    it('should delete an announcement', async () => {
        const id = 1;
        await repository.deleteAnnouncement(id);
        expect(prisma.team.delete).toHaveBeenCalledWith({ where: { id } });
    });

    it('should close an announcement', async () => {
        const id = 1;
        await repository.closeAnnouncement(id);
        expect(prisma.team.update).toHaveBeenCalledWith({
            where: { id },
            data: { isRecruited: false },
        });
    });
});
