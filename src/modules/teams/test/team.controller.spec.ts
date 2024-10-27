import { Test, TestingModule } from '@nestjs/testing';
import { TeamController } from '../team.controller';
import { TeamService } from '../team.service';
import { CreateAnnouncementRequest } from '../dto/request/create.team.request';

describe('TeamController', () => {
    let controller: TeamController;
    let service: TeamService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TeamController],
            providers: [
                {
                    provide: TeamService,
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

        controller = module.get<TeamController>(TeamController);
        service = module.get<TeamService>(TeamService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should create an announcement', async () => {
        const dto: CreateAnnouncementRequest = {
            name: 'Test',
            category: 'Project',
            isRecruited: true,
            isFinished: false,
            stacks: [1, 2],
        };
        await controller.createAnnouncement(dto);
        expect(service.createAnnouncement).toHaveBeenCalledWith(dto);
    });

    it('should find an announcement by ID', async () => {
        const id = 1;
        await controller.findAnnouncementById(id);
        expect(service.findAnnouncementById).toHaveBeenCalledWith(id);
    });

    it('should update an announcement', async () => {
        const id = 1;
        const updateData = { name: 'Updated Test' };
        await controller.updateAnnouncement(id, updateData);
        expect(service.updateAnnouncement).toHaveBeenCalledWith(id, updateData);
    });

    it('should delete an announcement', async () => {
        const id = 1;
        await controller.deleteAnnouncement(id);
        expect(service.deleteAnnouncement).toHaveBeenCalledWith(id);
    });

    it('should close an announcement', async () => {
        const id = 1;
        await controller.closeAnnouncement(id);
        expect(service.closeAnnouncement).toHaveBeenCalledWith(id);
    });
});
