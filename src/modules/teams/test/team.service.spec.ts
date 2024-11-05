import { Test, TestingModule } from '@nestjs/testing';
import { TeamService } from '../team.service';
import { TeamRepository } from '../repository/team.repository';
import {
    mockCreateAnnouncementRequest,
    mockTeamEntity,
    mockGetTeamResponseList,
    mockPaginationQueryDto,
    mockProjectData,
    mockTeamEntities,
} from './mock-data';

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
                        getAllTeams: jest.fn(),
                        getMyProjects: jest.fn(),
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

    describe('createAnnouncement', () => {
        it('should create an announcement', async () => {
            jest.spyOn(repository, 'createAnnouncement').mockResolvedValue(
                mockTeamEntity(),
            );

            expect(
                await service.createAnnouncement(mockCreateAnnouncementRequest),
            ).toEqual(mockTeamEntity());
            expect(repository.createAnnouncement).toHaveBeenCalledWith(
                mockCreateAnnouncementRequest,
            );
        });
    });

    describe('findAnnouncementById', () => {
        it('should find an announcement by ID', async () => {
            const announcementId = 1;
            jest.spyOn(repository, 'findAnnouncementById').mockResolvedValue(
                mockTeamEntity(),
            );

            expect(
                await service.findAnnouncementById(announcementId),
            ).toMatchObject(mockTeamEntity());
            expect(repository.findAnnouncementById).toHaveBeenCalledWith(
                announcementId,
            );
        });
    });

    describe('updateAnnouncement', () => {
        it('should update an announcement', async () => {
            const announcementId = 1;
            const updateData = { name: 'Updated Team Name' };
            const updatedAnnouncement = {
                ...mockTeamEntity(),
                ...updateData,
            };
            jest.spyOn(repository, 'updateAnnouncement').mockResolvedValue(
                updatedAnnouncement,
            );

            expect(
                await service.updateAnnouncement(announcementId, updateData),
            ).toEqual(updatedAnnouncement);
            expect(repository.updateAnnouncement).toHaveBeenCalledWith(
                announcementId,
                updateData,
            );
        });
    });

    describe('deleteAnnouncement', () => {
        it('should delete an announcement', async () => {
            const announcementId = 1;
            jest.spyOn(repository, 'deleteAnnouncement').mockResolvedValue(
                undefined,
            );

            expect(
                await service.deleteAnnouncement(announcementId),
            ).toBeUndefined();
            expect(repository.deleteAnnouncement).toHaveBeenCalledWith(
                announcementId,
            );
        });
    });

    describe('closeAnnouncement', () => {
        it('should close an announcement', async () => {
            const announcementId = 1;
            const closedAnnouncement = {
                ...mockTeamEntity(),
                isRecruited: false,
            };
            jest.spyOn(repository, 'closeAnnouncement').mockResolvedValue(
                closedAnnouncement,
            );

            expect(await service.closeAnnouncement(announcementId)).toEqual(
                closedAnnouncement,
            );
            expect(repository.closeAnnouncement).toHaveBeenCalledWith(
                announcementId,
            );
        });
    });

    it('should return all teams', async () => {
        jest.spyOn(repository, 'getAllTeams').mockResolvedValue(
            mockTeamEntities,
        );

        const result = await service.getAllTeams(mockPaginationQueryDto);

        expect(result).toMatchObject(mockGetTeamResponseList); // 깊이 있는 구조를 부분 일치로 비교
        expect(repository.getAllTeams).toHaveBeenCalled();
    });

    describe('getMyprojects', () => {
        it('should return projects for a user', async () => {
            const userId = 1;
            jest.spyOn(repository, 'getMyProjects').mockResolvedValue(
                mockProjectData,
            );

            const result = await service.getMyprojects(
                userId,
                mockPaginationQueryDto,
            );
            expect(result).toEqual(mockProjectData);
            expect(repository.getMyProjects).toHaveBeenCalledWith(
                userId,
                mockPaginationQueryDto.offset,
                mockPaginationQueryDto.limit,
            );
        });
    });
});
