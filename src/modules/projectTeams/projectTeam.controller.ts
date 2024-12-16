import { Body, Post, UseGuards, Req, Controller } from '@nestjs/common';
import { CreateProjectTeamRequest } from './dto/request/create.projectTeam.request';
import { ProjectTeamService } from './projectTeam.service';
// import { PaginationQueryDto } from '../../global/common/pagination.query.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt.guard';

@ApiTags('projectTeams')
@Controller('/projects')
export class ProjectTeamController {
    constructor(private readonly teamService: ProjectTeamService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '팀 공고 생성',
        description: '새로운 팀 공고를 생성합니다.',
    })
    async createProjectTeam(
        @Body() createAnnouncementDto: CreateProjectTeamRequest,
        @Req() request: any, // JWT 인증된 사용자 정보를 포함한 요청
    ): Promise<any> {
        const user = request.user; // JWT 인증된 사용자 정보 추출
        const announcement = await this.teamService.createProjectTeam(
            createAnnouncementDto,
            user, // 사용자 정보를 서비스로 전달
        );
        return {
            code: 201,
            message: '팀 공고가 생성되었습니다.',
            data: announcement,
        };
    }

    // @Get(':id')
    // @ApiOperation({
    //     summary: '단일 팀 공고 조회',
    //     description: '지정된 ID의 팀 공고를 조회합니다.',
    // })
    // async findAnnouncementById(
    //     @Param('id', ParseIntPipe) announcementId: number,
    // ): Promise<any> {
    //     const announcement =
    //         await this.teamService.findAnnouncementById(announcementId);
    //     return {
    //         code: 200,
    //         message: '팀 공고를 조회했습니다.',
    //         data: announcement,
    //     };
    // }
    //
    // @Patch(':id')
    // @ApiOperation({
    //     summary: '팀 공고 수정',
    //     description: '지정된 ID의 팀 공고를 수정합니다.',
    // })
    // async updateAnnouncement(
    //     @Param('id', ParseIntPipe) announcementId: number,
    //     @Body() updateData: Partial<CreateProjectTeamRequest>,
    // ): Promise<any> {
    //     const updatedAnnouncement = await this.teamService.updateAnnouncement(
    //         announcementId,
    //         updateData,
    //     );
    //     return {
    //         code: 200,
    //         message: '팀 공고가 수정되었습니다.',
    //         data: updatedAnnouncement,
    //     };
    // }
    //
    // @Delete(':id')
    // @ApiOperation({
    //     summary: '팀 공고 삭제',
    //     description: '지정된 ID의 팀 공고를 삭제합니다.',
    // })
    // async deleteAnnouncement(
    //     @Param('id', ParseIntPipe) announcementId: number,
    // ): Promise<any> {
    //     await this.teamService.deleteAnnouncement(announcementId);
    //     return {
    //         code: 200,
    //         message: '팀 공고가 삭제되었습니다.',
    //     };
    // }
    //
    // @Patch(':id/close')
    // @ApiOperation({
    //     summary: '팀 공고 마감',
    //     description: '지정된 ID의 팀 공고를 마감합니다.',
    // })
    // async closeAnnouncement(
    //     @Param('id', ParseIntPipe) announcementId: number,
    // ): Promise<any> {
    //     const closedAnnouncement =
    //         await this.teamService.closeAnnouncement(announcementId);
    //     return {
    //         code: 200,
    //         message: '팀 공고가 마감되었습니다.',
    //         data: closedAnnouncement,
    //     };
    // }
    //
    // @Get()
    // @ApiOperation({
    //     summary: '모든 팀 공고 조회',
    //     description: '모든 팀 공고를 조회합니다.',
    // })
    // async getAllTeams(@Query() query: PaginationQueryDto): Promise<any> {
    //     const teams = await this.teamService.getAllTeams(query);
    //     return {
    //         code: 200,
    //         message: '모든 팀 공고를 조회했습니다.',
    //         data: teams,
    //     };
    // }
    //
    // @Get('/user/:userId')
    // @ApiOperation({
    //     summary: '내가 참여한 팀 공고 조회',
    //     description: '자신이 참여한 팀 공고를 조회합니다.',
    // })
    // async getMyprojects(
    //     @Param('userId', ParseIntPipe) userId: number,
    //     @Query() query: PaginationQueryDto,
    // ): Promise<any> {
    //     const projects = await this.teamService.getMyprojects(userId, query);
    //     return {
    //         code: 200,
    //         message: '해당 유저의 팀 공고를 조회했습니다.',
    //         data: projects,
    //     };
    // }
}
