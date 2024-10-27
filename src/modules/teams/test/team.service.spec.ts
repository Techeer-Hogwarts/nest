import { Test, TestingModule } from '@nestjs/testing';
import { TeamService } from '../team.service';
import { TeamRepository } from '../repository/team.repository';
import { CreateAnnouncementRequest } from '../dto/request/create.team.request';

describe('TeamService', () => {
    let service: TeamService;
    let repository: TeamRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TeamService,
                {
                    provide: TeamRepository,
                    useValue: {
                        createAnnouncement: jest.fn(),
                        findAnnouncementById: jest.fn(),
                        updateAnnouncement: jest.fn(),
                        deleteAnnouncement: jest.fn(),
                        closeAnnouncement: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<TeamService>(TeamService);
        repository = module.get<TeamRepository>(TeamRepository);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create an announcement', async () => {
        const dto: CreateAnnouncementRequest = {
            name: 'Test',
            category: 'Project',
            isRecruited: true,
            isFinished: false,
            stacks: [1, 2],
        };
        await service.createAnnouncement(dto);
        expect(repository.createAnnouncement).toHaveBeenCalledWith(dto);
    });

    it('should find an announcement by ID', async () => {
        const id = 1;
        await service.findAnnouncementById(id);
        expect(repository.findAnnouncementById).toHaveBeenCalledWith(id);
    });

    it('should update an announcement', async () => {
        const id = 1;
        const updateData = { name: 'Updated Test' };
        await service.updateAnnouncement(id, updateData);
        expect(repository.updateAnnouncement).toHaveBeenCalledWith(
            id,
            updateData,
        );
    });

    it('should delete an announcement', async () => {
        const id = 1;
        await service.deleteAnnouncement(id);
        expect(repository.deleteAnnouncement).toHaveBeenCalledWith(id);
    });

    it('should close an announcement', async () => {
        const id = 1;
        await service.closeAnnouncement(id);
        expect(repository.closeAnnouncement).toHaveBeenCalledWith(id);
    });
});
