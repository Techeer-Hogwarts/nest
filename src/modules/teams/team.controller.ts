import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { CreateAnnouncementRequest } from './dto/request/create.team.request';
import { TeamService } from './team.service';

@Controller('teams')
export class TeamController {
    constructor(private readonly teamService: TeamService) {}

    @Post()
    async createAnnouncement(
        @Body() createAnnouncementDto: CreateAnnouncementRequest,
    ) {
        return await this.teamService.createAnnouncement(createAnnouncementDto);
    }

    @Get(':id')
    async findAnnouncementById(@Param('id') announcementId: number) {
        return await this.teamService.findAnnouncementById(announcementId);
    }

    @Patch(':id')
    async updateAnnouncement(
        @Param('id') announcementId: number,
        @Body() updateData: Partial<CreateAnnouncementRequest>,
    ) {
        return await this.teamService.updateAnnouncement(
            announcementId,
            updateData,
        );
    }

    @Delete(':id')
    async deleteAnnouncement(@Param('id') announcementId: number) {
        return await this.teamService.deleteAnnouncement(announcementId);
    }

    @Patch(':id/close')
    async closeAnnouncement(@Param('id') announcementId: number) {
        return await this.teamService.closeAnnouncement(announcementId);
    }
}
