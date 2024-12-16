import { Controller, Post, Body, UploadedFile, UseInterceptors, UseGuards, Req } from '@nestjs/common';
import { StudyTeamService } from "./studyTeam.service";
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateStudyTeamRequest } from './dto/request/create.studyTeam.request';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('studyTeams')
@Controller('/studyTeams')
export class StudyTeamController {
    constructor(
        private readonly studyTeamService: StudyTeamService,
    ) {}

    // 스터디 공고 업로드 
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '스터디 공고 생성',
        description: '새로운 스터다 공고를 생성합니다.',
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadStudyTeam(
        @Body() createStudyTeamRequest: CreateStudyTeamRequest,
        @UploadedFile() file: Express.Multer.File,
        @Req() request: any
    ): Promise<any> {
        const user = request.user; // JWT 인증된 사용자 정보 추출

        if (!user || !user.id) {
            throw new Error('유효한 사용자 아이디가 필요합니다.');
        }

        const studyData = await this.studyTeamService.createStudyTeam({ 
            ...createStudyTeamRequest, 
            file, 
        });
        
        return {
            code: 201,
            message: '스터디 공고가 생성되었습니다.',
            data: studyData,
        };
    }


    // 스터디 공고 수정

    // 스터디 공고 마감

    // 스터디 공고 삭제

    // 특정 유저가 참여한 스터디 조회(토큰으로)

    // 스터디 아이디로 스터디 상세 조회

    // 특정 스터디 모든 인원을 조회하는 api(아이디로)
}