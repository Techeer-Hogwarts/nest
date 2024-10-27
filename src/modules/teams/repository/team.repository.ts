import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnnouncementRequest } from '../dto/request/create.team.request';

@Injectable()
export class TeamRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createAnnouncement(data: CreateAnnouncementRequest): Promise<any> {
        const { stacks, ...announcementData } = data;

        const newAnnouncement = await this.prisma.team.create({
            data: announcementData as any,
        });
        if (stacks && stacks.length > 0) {
            await this.prisma.teamStack.createMany({
                data: stacks.map((stackId) => ({
                    teamId: newAnnouncement.id, // Changed to match relationship
                    stackId,
                })) as any,
            });
        }

        return newAnnouncement;
    }

    async findAnnouncementById(announcementId: number): Promise<any> {
        return this.prisma.team.findUnique({
            where: { id: announcementId },
        });
    }

    async updateAnnouncement(
        announcementId: number,
        updateData: Partial<CreateAnnouncementRequest>,
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
}
