import { Injectable } from '@nestjs/common';
import { TeamRepository } from './repository/team.repository';
import { CreateAnnouncementRequest } from './dto/request/create.team.request';

@Injectable()
export class TeamService {
    constructor(private readonly teamRepository: TeamRepository) {}

    async createAnnouncement(data: CreateAnnouncementRequest): Promise<any> {
        return this.teamRepository.createAnnouncement(data);
    }

    async findAnnouncementById(announcementId: number): Promise<any> {
        return this.teamRepository.findAnnouncementById(announcementId);
    }

    async updateAnnouncement(
        announcementId: number,
        updateData: Partial<CreateAnnouncementRequest>,
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
}
