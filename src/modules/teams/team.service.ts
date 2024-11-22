import { Injectable } from '@nestjs/common';
import { TeamRepository } from './repository/team.repository';
import { CreateTeamRequest } from './dto/request/create.team.request';
import { GetTeamResponse } from './dto/response/get.team.response';
import { PaginationQueryDto } from '../../global/common/pagination.query.dto';
import { Team } from '@prisma/client';
import { TeamEntity } from './entities/team.entity';
import { StackEntity } from '../stacks/entities/stack.entity';

@Injectable()
export class TeamService {
    constructor(private readonly teamRepository: TeamRepository) {}

    async createTeam(data: CreateTeamRequest): Promise<any> {
        return this.teamRepository.createTeam(data);
    }

    async findAnnouncementById(announcementId: number): Promise<any> {
        return this.teamRepository.findAnnouncementById(announcementId);
    }

    async updateAnnouncement(
        announcementId: number,
        updateData: Partial<CreateTeamRequest>,
    ): Promise<any> {
        return this.teamRepository.updateAnnouncement(
            announcementId,
            updateData,
        );
    }

    async deleteAnnouncement(announcementId: number): Promise<any> {
        return this.teamRepository.deleteAnnouncement(announcementId);
    }

    async closeAnnouncement(announcementId: number): Promise<any> {
        return this.teamRepository.closeAnnouncement(announcementId);
    }

    async getAllTeams(query: PaginationQueryDto): Promise<GetTeamResponse[]> {
        const { offset = 0, limit = 10 } = query;
        const teams = await this.teamRepository.getAllTeams(offset, limit);

        return teams.slice(offset, offset + limit).map(
            (team) =>
                new GetTeamResponse({
                    ...team,
                    teamMembers: team.teamMembers || [],
                    teamStacks:
                        team.teamStacks?.map((teamStack) => ({
                            id: teamStack.id,
                            createdAt: teamStack.createdAt,
                            updatedAt: teamStack.updatedAt,
                            isDeleted: teamStack.isDeleted,
                            stackId: teamStack.stackId,
                            teamId: teamStack.teamId,
                            isMain: teamStack.isMain ?? true,
                            team: team as TeamEntity,
                            stack: {
                                id: teamStack.stack.id,
                                name: teamStack.stack.name,
                                category: teamStack.stack.category,
                                createdAt:
                                    teamStack.stack.createdAt || new Date(), // 필드가 없으면 기본값 사용
                                updatedAt:
                                    teamStack.stack.updatedAt || new Date(),
                                isDeleted: teamStack.stack.isDeleted || false,
                            } as StackEntity,
                        })) || [],
                }),
        );
    }

    async getMyprojects(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<Team[]> {
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
        return this.teamRepository.getMyProjects(userId, offset, limit);
    }
}
