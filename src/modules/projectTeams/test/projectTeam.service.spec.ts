import { Test, TestingModule } from '@nestjs/testing';
import { ProjectTeamService } from '../projectTeam.service';
import { ProjectTeamRepository } from '../repository/projectTeam.repository';
import { mockCreateProjectTeamRequest, mockTeamEntity } from './mock-data';
// import { GetProjectTeamResponse } from '../dto/response/get.projectTeam.response';

describe('ProjectTeamService', () => {
    let service: ProjectTeamService;
    let repository: ProjectTeamRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProjectTeamService,
                {
                    provide: ProjectTeamRepository,
                    useValue: {
                        createProjectTeam: jest.fn(),
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

        service = module.get<ProjectTeamService>(ProjectTeamService);
        repository = module.get<ProjectTeamRepository>(ProjectTeamRepository);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createProjectTeam', () => {
        it('should create a project team', async () => {
            const mockUser = { id: 1 };
            jest.spyOn(repository, 'createProjectTeam').mockResolvedValue(
                mockTeamEntity(),
            );

            const result = await service.createProjectTeam(
                mockCreateProjectTeamRequest,
                mockUser,
            );

            expect(result).toEqual(mockTeamEntity());
            expect(repository.createProjectTeam).toHaveBeenCalledWith({
                ...mockCreateProjectTeamRequest,
                userId: mockUser.id,
            });
        });
    });

    // describe('findAnnouncementById', () => {
    //     it('should return a project team by ID', async () => {
    //         const announcementId = 1;
    //         jest.spyOn(repository, 'findAnnouncementById').mockResolvedValue(
    //             mockTeamEntity(),
    //         );
    //
    //         const result = await service.findAnnouncementById(announcementId);
    //
    //         expect(result).toEqual(mockTeamEntity());
    //         expect(repository.findAnnouncementById).toHaveBeenCalledWith(
    //             announcementId,
    //         );
    //     });
    // });
    //
    // describe('updateAnnouncement', () => {
    //     it('should update a project team announcement', async () => {
    //         const announcementId = 1;
    //         const updateData = { name: 'Updated Team Name' };
    //         const updatedAnnouncement = {
    //             ...mockTeamEntity(),
    //             ...updateData,
    //         };
    //         jest.spyOn(repository, 'updateAnnouncement').mockResolvedValue(
    //             updatedAnnouncement,
    //         );
    //
    //         const result = await service.updateAnnouncement(
    //             announcementId,
    //             updateData,
    //         );
    //
    //         expect(result).toEqual(updatedAnnouncement);
    //         expect(repository.updateAnnouncement).toHaveBeenCalledWith(
    //             announcementId,
    //             updateData,
    //         );
    //     });
    // });
    //
    // describe('deleteAnnouncement', () => {
    //     it('should delete a project team announcement', async () => {
    //         const announcementId = 1;
    //         jest.spyOn(repository, 'deleteAnnouncement').mockResolvedValue(
    //             undefined,
    //         );
    //
    //         const result = await service.deleteAnnouncement(announcementId);
    //
    //         expect(result).toBeUndefined();
    //         expect(repository.deleteAnnouncement).toHaveBeenCalledWith(
    //             announcementId,
    //         );
    //     });
    // });
    //
    // describe('closeAnnouncement', () => {
    //     it('should close a project team announcement', async () => {
    //         const announcementId = 1;
    //         const closedAnnouncement = {
    //             ...mockTeamEntity(),
    //             isRecruited: false,
    //         };
    //         jest.spyOn(repository, 'closeAnnouncement').mockResolvedValue(
    //             closedAnnouncement,
    //         );
    //
    //         const result = await service.closeAnnouncement(announcementId);
    //
    //         expect(result).toEqual(closedAnnouncement);
    //         expect(repository.closeAnnouncement).toHaveBeenCalledWith(
    //             announcementId,
    //         );
    //     });
    // });
    //
    // describe('getAllTeams', () => {
    //     it('should return all project teams with pagination', async () => {
    //         jest.spyOn(repository, 'getAllTeams').mockResolvedValue(
    //             mockProjectData,
    //         );
    //
    //         const result = await service.getAllTeams(mockPaginationQueryDto);
    //
    //         expect(result).toEqual(
    //             mockProjectData.map((team) => new GetProjectTeamResponse(team)),
    //         );
    //         expect(repository.getAllTeams).toHaveBeenCalledWith(
    //             mockPaginationQueryDto.offset,
    //             mockPaginationQueryDto.limit,
    //         );
    //     });
    // });
    //
    // describe('getMyProjects', () => {
    //     it('should return projects for a specific user', async () => {
    //         const userId = 1;
    //         jest.spyOn(repository, 'getMyProjects').mockResolvedValue(
    //             mockProjectData,
    //         );
    //
    //         const result = await service.getMyprojects(
    //             userId,
    //             mockPaginationQueryDto,
    //         );
    //
    //         expect(result).toEqual(
    //             mockProjectData.map((team) => new GetProjectTeamResponse(team)),
    //         );
    //         expect(repository.getMyProjects).toHaveBeenCalledWith(
    //             userId,
    //             mockPaginationQueryDto.offset,
    //             mockPaginationQueryDto.limit,
    //         );
    //     });
    // });
});
