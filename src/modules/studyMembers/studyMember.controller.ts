import { Controller, Post, Patch, Get, Param, Body, UseGuards, Req, Logger } from "@nestjs/common";
import { StudyMemberService } from "./studyMember.service"; 
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateStudyMemberRequest } from './dto/create.studyMember.request';

@ApiTags('studyMembers')
@Controller('/studyMembers')
export class StudyMemberController {
    private readonly logger = new Logger(StudyMemberController.name);

    constructor(private readonly studyMemberService: StudyMemberService) {}

    // 스터디 지원(status: PENDING)으로 데이터 삽입, 스터디팀은 아이디로 받기 
    @Post('/apply')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: '스터디 지원', description: '스터디에 지원합니다.' })
    async applyToStudyTeam(
        @Body() createStudyMemberRequest: CreateStudyMemberRequest, 
        @Req() request: any
    ): Promise<any> {
        const userId = request.user.id;
        createStudyMemberRequest.userId = userId; 
        const applyData = await this.studyMemberService.applyToStudyTeam(createStudyMemberRequest);
        return {
            code: 201,
            message: '스터디 지원에 성공했습니다.',
            data: applyData,
        }
    }

    // 스터디 지원 취소 : isDeleted = true(지원한 사람만 가능)
    @Patch('/:studyMemberId/cancel')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: '스터디 지원 취소', description: '스터디 지원을 취소합니다.' })
    async cancelApplication(
        @Param('studyMemberId') studyMemberId: number, 
        @Req() request: any
    ): Promise<any> {
        const userId = request.user.id;
        const cancelData =  await this.studyMemberService.cancelApplication(studyMemberId, userId);
        return {
            code: 200,
            message: '스터디 지원 취소에 성공했습니다.',
            data: cancelData,
        }
    }

    // 스터디 지원자 조회 : status: PENDING인 데이터 조회(스터디팀에 속한 멤버만 조회 가능 멤버가 아니면 확인할 수 없습니다 )
    @Get('/:studyTeamId/applicants')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: '스터디 지원자 조회', description: '스터디 지원자를 조회합니다.' })
    async getApplicants(
        @Param('studyTeamId') studyTeamId: number, 
        @Req() request: any
    ): Promise<any> {
        const userId = request.user.id;
        const applyData =  await this.studyMemberService.getApplicants(studyTeamId, userId);
        return {
            code: 200,
            message: '스터디 지원자 조회에 성공했습니다.',
            data: applyData,
        }
    }

    // 스터디 지원자 수락/거절 : status: PENDING -> status: APPROVED/REJECTED(스터디팀에 속한 멤버만 가능)
    @Patch('/:studyMemberId/accept')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: '스터디 지원 수락', description: '스터디 지원을 수락합니다.' })
    async acceptApplicant(
        @Param('studyMemberId') studyMemberId: number, 
        @Req() request: any
    ): Promise<any> {
        const userId = request.user.id;
        const data = await this.studyMemberService.acceptApplicant(studyMemberId, userId);
        return {
            code: 200,
            message: '스터디 지원을 수락했습니다.',
            data: data,
        }
    }

    // 스터디 지원자 수락/거절 : status: PENDING -> status: APPROVED/REJECTED(스터디팀에 속한 멤버만 가능)
    @Patch('/:studyMemberId/reject')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: '스터디 지원 거절', description: '스터디 지원을 거절합니다.' })
    async rejectApplicant(
        @Param('studyMemberId') studyMemberId: number, 
        @Req() request: any
    ): Promise<any> {
        const userId = request.user.id;
        const data = await this.studyMemberService.rejectApplicant(studyMemberId, userId);
        return {
            code: 200,
            message: '스터디 지원을 거절했습니다.',
            data: data,
        }
    }

    // 스터디 팀원 추가 기능 : status: APPROVED인 데이터 추가(스터디팀에 속한 멤버만 가능)
    @Post('/:studyTeamId/add-member')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: '스터디 팀원 추가', description: '스터디 팀에 멤버를 추가합니다.' })
    async addMemberToStudyTeam(
        @Param('studyTeamId') studyTeamId: number, 
        @Body('userId') userId: number, 
        @Req() request: any
    ): Promise<any> {
        const requesterId = request.user.id;
        const data = await this.studyMemberService.addMemberToStudyTeam(studyTeamId, userId, requesterId);
        return {
            code: 201,
            message: '스터디 팀원 추가에 성공했습니다.',
            data: data,
        }
    }
}