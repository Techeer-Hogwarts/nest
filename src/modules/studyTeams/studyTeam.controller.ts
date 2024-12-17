import { Controller, Post, Body, UploadedFiles, UseInterceptors, UseGuards, Req, Logger, BadRequestException } from '@nestjs/common';
import { StudyTeamService } from "./studyTeam.service";
import { CreateStudyTeamRequest } from './dto/request/create.studyTeam.request';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('studyTeams')
@Controller('/studyTeams')
export class StudyTeamController {
    private readonly logger = new Logger(StudyTeamController.name);

    constructor(
        private readonly studyTeamService: StudyTeamService,
    ) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: '스터디 공고 생성', description: '새로운 스터디 공고를 생성합니다.' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: '스터디 공고 생성 요청 데이터',
        schema: {
            type: 'object',
            properties: {
                files: { 
                  type: 'array', 
                  items: { type: 'string', format: 'binary' }, 
                  description: '업로드할 이미지 파일들 (여러개 가능)' 
                },
                createStudyTeamRequest: { 
                    type: 'string', 
                    description: '스터디 공고 데이터',
                    example: JSON.stringify({
                        name: "React Study",
                        githubLink: "https://github.com/example-study",
                        notionLink: "https://notion.so/example-study",
                        studyExplain: "리액트 서적을 읽고 함께 학습하는 스터디입니다.",
                        goal: "두 달 안에 리액트 서적 완독",
                        rule: "매주 일요일 오후 2시에 온라인으로 진행",
                        isFinished: false,
                        isRecruited: true,
                        recruitNum: 5,
                        recruitExplain: "시간 약속을 잘 지키는 사람과 함께하고 싶습니다.",
                        studyMember: [
                            { userId: 1, isLeader: true },
                            { userId: 2, isLeader: false }
                        ]
                    })
                }
            }
        }
    })
    @UseInterceptors(FilesInterceptor('files', 10)) // 파일 최대 업로드 10개
    async uploadStudyTeam(
        @Body('createStudyTeamRequest') createStudyTeamRequest: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Req() request: any
    ): Promise<any> {
      const user = request.user; 
      if (!user) throw new BadRequestException('사용자 정보가 없습니다.');

      try {
        if (!files) throw new BadRequestException('파일이 필요합니다.');

        // 🔥 JSON 문자열을 객체로 변환
        const parsedBody = JSON.parse(createStudyTeamRequest);
        const createStudyTeamDto = plainToInstance(CreateStudyTeamRequest, parsedBody);

        const studyData = await this.studyTeamService.createStudyTeam(createStudyTeamDto, files);

        return {
            code: 201,
            message: '스터디 공고가 생성되었습니다.',
            data: studyData,
        };
    } catch (error) {
        throw error;
    }
}


    // 스터디 공고 수정

    // 스터디 공고 마감

    // 스터디 공고 삭제

    // 특정 유저가 참여한 스터디 조회(토큰으로)

    // 스터디 아이디로 스터디 상세 조회

    // 특정 스터디 모든 인원을 조회하는 api(아이디로)
}