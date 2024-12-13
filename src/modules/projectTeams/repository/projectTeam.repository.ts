import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectTeamRequest } from '../dto/request/create.projectTeam.request';
// import {
//     TeamStack,
//     Stack,
//     User,
//     ProjectMember,
//     ProjectTeam,
// } from '@prisma/client';

@Injectable()
export class ProjectTeamRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createProjectTeam(
        data: CreateProjectTeamRequest & { userId: string },
    ): Promise<any> {
        const { stacks, ...announcementData } = data;

        // 팀 공고 생성 시 사용자 ID 포함
        const newAnnouncement = await this.prisma.projectTeam.create({
            data: {
                ...announcementData,
                userId: data.userId, // 사용자 ID 저장
            } as any,
        });

        // 스택 정보 연결
        if (stacks && stacks.length > 0) {
            await this.prisma.teamStack.createMany({
                data: stacks.map((stackId) => ({
                    projectTeamId: newAnnouncement.id,
                    stackId,
                })) as any,
            });
        }

        return newAnnouncement;
    }

    // async findAnnouncementById(announcementId: number): Promise<any> {
    //     return this.prisma.projectTeam.findUnique({
    //         where: { id: announcementId },
    //         include: {
    //             teamStacks: {
    //                 include: {
    //                     stack: true,
    //                 },
    //             },
    //             projectMember: {
    //                 include: {
    //                     user: true,
    //                 },
    //             },
    //         },
    //     });
    // }
    //
    // async updateAnnouncement(
    //     announcementId: number,
    //     updateData: Partial<CreateProjectTeamRequest>,
    // ): Promise<any> {
    //     return this.prisma.projectTeam.update({
    //         where: { id: announcementId },
    //         data: updateData as any,
    //     });
    // }
    //
    // async deleteAnnouncement(announcementId: number): Promise<any> {
    //     return this.prisma.projectTeam.delete({
    //         where: { id: announcementId },
    //     });
    // }
    //
    // async closeAnnouncement(announcementId: number): Promise<any> {
    //     return this.prisma.projectTeam.update({
    //         where: { id: announcementId },
    //         data: { isRecruited: false },
    //     });
    // }
    //
    // async getAllTeams(
    //     offset: number,
    //     limit: number,
    // ): Promise<
    //     (ProjectTeam & {
    //         teamStacks: (TeamStack & { stack: Stack })[];
    //         projectMember: (ProjectMember & { user: User })[];
    //     })[]
    // > {
    //     return this.prisma.projectTeam.findMany({
    //         where: { isDeleted: false },
    //         include: {
    //             teamStacks: {
    //                 include: {
    //                     stack: true,
    //                 },
    //             },
    //             projectMember: {
    //                 include: {
    //                     user: true,
    //                 },
    //             },
    //         },
    //         skip: offset,
    //         take: limit,
    //     });
    // }
    //
    // async getMyProjects(
    //     userId: number,
    //     offset: number,
    //     limit: number,
    // ): Promise<
    //     (ProjectTeam & {
    //         teamStacks: (TeamStack & { stack: Stack })[];
    //         projectMember: (ProjectMember & { user: User })[];
    //     })[]
    // > {
    //     return this.prisma.projectTeam.findMany({
    //         where: {
    //             isDeleted: false,
    //             projectMember: {
    //                 some: {
    //                     userId: userId,
    //                 },
    //             },
    //         },
    //         include: {
    //             teamStacks: {
    //                 include: {
    //                     stack: true,
    //                 },
    //             },
    //             projectMember: {
    //                 include: {
    //                     user: true,
    //                 },
    //             },
    //         },
    //         skip: offset,
    //         take: limit,
    //     });
    // }
}
