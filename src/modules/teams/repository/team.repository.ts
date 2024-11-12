import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeamRequest } from '../dto/request/create.team.request';
import { Team, TeamStack, Stack, TeamMember, User } from '@prisma/client';

@Injectable()
export class TeamRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createTeam(data: CreateTeamRequest): Promise<any> {
        const { stacks, ...announcementData } = data;

        const newAnnouncement = await this.prisma.team.create({
            data: announcementData as any,
        });
        if (stacks && stacks.length > 0) {
            await this.prisma.teamStack.createMany({
                data: stacks.map((stackId) => ({
                    teamId: newAnnouncement.id,
                    stackId,
                })) as any,
            });
        }

        return newAnnouncement;
    }

    async findAnnouncementById(announcementId: number): Promise<any> {
        return this.prisma.team.findUnique({
            where: { id: announcementId },
            include: {
                teamStacks: {
                    include: {
                        stack: true,
                    },
                },
                teamMembers: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }

    async updateAnnouncement(
        announcementId: number,
        updateData: Partial<CreateTeamRequest>,
    ): Promise<any> {
        return this.prisma.team.update({
            where: { id: announcementId },
            data: updateData as any,
        });
    }

    async deleteAnnouncement(announcementId: number): Promise<any> {
        return this.prisma.team.delete({
            where: { id: announcementId },
        });
    }

    async closeAnnouncement(announcementId: number): Promise<any> {
        return this.prisma.team.update({
            where: { id: announcementId },
            data: { isRecruited: false },
        });
    }

    async getAllTeams(
        offset: number,
        limit: number,
    ): Promise<
        (Team & {
            teamStacks: (TeamStack & { stack: Stack })[];
            teamMembers: (TeamMember & { user: User })[];
        })[]
    > {
        return this.prisma.team.findMany({
            where: { isDeleted: false },
            include: {
                teamStacks: {
                    include: {
                        stack: true,
                    },
                },
                teamMembers: {
                    include: {
                        user: true,
                    },
                },
            },
            skip: offset,
            take: limit,
        });
    }

    async getMyProjects(
        userId: number,
        offset: number,
        limit: number,
    ): Promise<
        (Team & {
            teamStacks: (TeamStack & { stack: Stack })[];
            teamMembers: (TeamMember & { user: User })[];
        })[]
    > {
        return this.prisma.team.findMany({
            where: {
                isDeleted: false,
                teamMembers: {
                    some: {
                        userId: userId,
                    },
                },
            },
            include: {
                teamStacks: {
                    include: {
                        stack: true,
                    },
                },
                teamMembers: {
                    include: {
                        user: true,
                    },
                },
            },
            skip: offset,
            take: limit,
        });
    }
}
