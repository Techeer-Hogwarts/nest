import { Injectable } from '@nestjs/common';
import { ProjectTeamRepository } from './repository/projectTeam.repository';
import { CreateProjectTeamRequest } from './dto/request/create.projectTeam.request';
// import { GetProjectTeamResponse } from './dto/response/get.projectTeam.response';
// import { PaginationQueryDto } from '../../global/common/pagination.query.dto';
// import { ProjectTeamEntity } from './entities/projectTeam.entity';
// import { StackEntity } from '../stacks/entities/stack.entity';
// import { Team } from '@prisma/client';

@Injectable()
export class ProjectTeamService {
    constructor(
        private readonly projectTeamRepository: ProjectTeamRepository,
    ) {}

    async createProjectTeam(
        data: CreateProjectTeamRequest,
        user: any, // JWT 인증된 사용자 정보
    ): Promise<any> {
        // 사용자 정보를 포함한 데이터 생성
        const teamData = {
            ...data,
            userId: user.id, // 사용자 ID 추가
        };
        return this.projectTeamRepository.createProjectTeam(teamData);
    }

    // async findAnnouncementById(announcementId: number): Promise<any> {
    //     return this.projectTeamRepository.findAnnouncementById(announcementId);
    // }
    //
    // async updateAnnouncement(
    //     announcementId: number,
    //     updateData: Partial<CreateProjectTeamRequest>,
    // ): Promise<any> {
    //     return this.projectTeamRepository.updateAnnouncement(
    //         announcementId,
    //         updateData,
    //     );
    // }
    //
    // async deleteAnnouncement(announcementId: number): Promise<any> {
    //     return this.projectTeamRepository.deleteAnnouncement(announcementId);
    // }
    //
    // async closeAnnouncement(announcementId: number): Promise<any> {
    //     return this.projectTeamRepository.closeAnnouncement(announcementId);
    // }
    //
    // async getAllTeams(
    //     query: PaginationQueryDto,
    // ): Promise<GetProjectTeamResponse[]> {
    //     const { offset = 0, limit = 10 } = query;
    //     const teams = await this.projectTeamRepository.getAllTeams(
    //         offset,
    //         limit,
    //     );
    //
    //     return teams.slice(offset, offset + limit).map(
    //         (team) =>
    //             new GetProjectTeamResponse({
    //                 ...team,
    //                 projectMembers: team.projectMember || [],
    //                 teamStacks:
    //                     team.teamStacks?.map((teamStack) => ({
    //                         id: teamStack.id,
    //                         createdAt: teamStack.createdAt,
    //                         updatedAt: teamStack.updatedAt,
    //                         isDeleted: teamStack.isDeleted,
    //                         stackId: teamStack.stackId,
    //                         projectTeamId: teamStack.projectTeamId,
    //                         isMain: teamStack.isMain ?? true,
    //                         projectTeam: team as ProjectTeamEntity,
    //                         stack: {
    //                             id: teamStack.stack.id,
    //                             name: teamStack.stack.name,
    //                             category: teamStack.stack.category,
    //                             createdAt:
    //                                 teamStack.stack.createdAt || new Date(), // 필드가 없으면 기본값 사용
    //                             updatedAt:
    //                                 teamStack.stack.updatedAt || new Date(),
    //                             isDeleted: teamStack.stack.isDeleted || false,
    //                         } as StackEntity,
    //                     })) || [],
    //             }),
    //     );
    // }
    //
    // async getMyprojects(
    //     userId: number,
    //     query: PaginationQueryDto,
    // ): Promise<Team[]> {
    //     const { offset = 0, limit = 10 }: PaginationQueryDto = query;
    //     return this.projectTeamRepository.getMyProjects(userId, offset, limit);
    // }
}
