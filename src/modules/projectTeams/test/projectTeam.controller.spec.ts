import { Test, TestingModule } from '@nestjs/testing';
import { ProjectTeamController } from '../projectTeam.controller';
import { ProjectTeamService } from '../projectTeam.service';
import { JwtAuthGuard } from '../../../auth/jwt.guard';
import {
    mockCreateProjectTeamRequest,
    mockGetTeamResponseList,
} from './mock-data';

describe('ProjectTeamController', () => {
    let teamController: ProjectTeamController;
    let teamService: ProjectTeamService;

    beforeEach(async () => {
        const mockJwtAuthGuard = {
            canActivate: jest.fn(() => true), // 항상 인증이 통과되도록 설정
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProjectTeamController],
            providers: [
                {
                    provide: ProjectTeamService,
                    useValue: {
                        createProjectTeam: jest
                            .fn()
                            .mockResolvedValue(mockGetTeamResponseList[0]),
                        findAnnouncementById: jest
                            .fn()
                            .mockResolvedValue(mockGetTeamResponseList[0]),
                        updateAnnouncement: jest
                            .fn()
                            .mockResolvedValue(mockGetTeamResponseList[1]),
                        deleteAnnouncement: jest
                            .fn()
                            .mockResolvedValue(undefined),
                        closeAnnouncement: jest
                            .fn()
                            .mockResolvedValue(mockGetTeamResponseList[1]),
                        getAllTeams: jest
                            .fn()
                            .mockResolvedValue(mockGetTeamResponseList),
                        getMyprojects: jest
                            .fn()
                            .mockResolvedValue(mockGetTeamResponseList),
                    },
                },
            ],
        })
            .overrideGuard(JwtAuthGuard) // JwtAuthGuard를 Mock으로 교체
            .useValue(mockJwtAuthGuard)
            .compile();

        teamController = module.get<ProjectTeamController>(
            ProjectTeamController,
        );
        teamService = module.get<ProjectTeamService>(ProjectTeamService);
    });

    it('should be defined', () => {
        expect(teamController).toBeDefined();
    });

    describe('createProjectTeam', () => {
        it('should create a new team announcement', async () => {
            const result = await teamController.createProjectTeam(
                mockCreateProjectTeamRequest,
                { user: { id: 1 } }, // Mocked user from request
            );
            expect(result).toEqual({
                code: 201,
                message: '팀 공고가 생성되었습니다.',
                data: mockGetTeamResponseList[0],
            });
            expect(teamService.createProjectTeam).toHaveBeenCalledWith(
                mockCreateProjectTeamRequest,
                { id: 1 },
            );
        });
    });
});

// describe('findAnnouncementById', () => {
//     it('should return a single team announcement by ID', async () => {
//         const result = await teamController.findAnnouncementById(1);
//         expect(result).toEqual({
//             code: 200,
//             message: '팀 공고를 조회했습니다.',
//             data: mockGetTeamResponseList[0],
//         });
//         expect(teamService.findAnnouncementById).toHaveBeenCalledWith(1);
//     });
// });
//
// describe('updateAnnouncement', () => {
//     it('should update a team announcement', async () => {
//         const updateData = { name: 'Updated Team' };
//         const result = await teamController.updateAnnouncement(
//             1,
//             updateData,
//         );
//         expect(result).toEqual({
//             code: 200,
//             message: '팀 공고가 수정되었습니다.',
//             data: mockGetTeamResponseList[1],
//         });
//         expect(teamService.updateAnnouncement).toHaveBeenCalledWith(
//             1,
//             updateData,
//         );
//     });
// });
//
// describe('deleteAnnouncement', () => {
//     it('should delete a team announcement by ID', async () => {
//         const result = await teamController.deleteAnnouncement(1);
//         expect(result).toEqual({
//             code: 200,
//             message: '팀 공고가 삭제되었습니다.',
//         });
//         expect(teamService.deleteAnnouncement).toHaveBeenCalledWith(1);
//     });
// });
//
// describe('closeAnnouncement', () => {
//     it('should close a team announcement', async () => {
//         const result = await teamController.closeAnnouncement(1);
//         expect(result).toEqual({
//             code: 200,
//             message: '팀 공고가 마감되었습니다.',
//             data: mockGetTeamResponseList[1],
//         });
//         expect(teamService.closeAnnouncement).toHaveBeenCalledWith(1);
//     });
// });
//
// describe('getAllTeams', () => {
//     it('should return all team announcements with pagination', async () => {
//         const result = await teamController.getAllTeams(
//             mockPaginationQueryDto,
//         );
//         expect(result).toEqual({
//             code: 200,
//             message: '모든 팀 공고를 조회했습니다.',
//             data: mockGetTeamResponseList,
//         });
//         expect(teamService.getAllTeams).toHaveBeenCalledWith(
//             mockPaginationQueryDto,
//         );
//     });
// });
//
// describe('getMyprojects', () => {
//     it('should return projects the user is part of', async () => {
//         const result = await teamController.getMyprojects(
//             1,
//             mockPaginationQueryDto,
//         );
//         expect(result).toEqual({
//             code: 200,
//             message: '해당 유저의 팀 공고를 조회했습니다.',
//             data: mockProjectData,
//         });
//         expect(teamService.getMyprojects).toHaveBeenCalledWith(
//             1,
//             mockPaginationQueryDto,
//         );
//     });
// });
