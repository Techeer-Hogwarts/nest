import { Controller, Post, Body, UploadedFiles, UseInterceptors, UseGuards, Req, Logger, BadRequestException, Patch, Param, Get } from '@nestjs/common';
import { StudyTeamService } from "./studyTeam.service";
import { CreateStudyTeamRequest } from './dto/request/create.studyTeam.request';
import { UpdateStudyTeamRequest } from './dto/request/update.studyTeam.request';
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

    @Post() // 슬랙봇 연동 추가될 예정
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
        @Body('updateStudyTeamRequest') updateStudyTeamRequest: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Req() request: any
    ): Promise<any> {
      const user = request.user; 
      if (!user) throw new BadRequestException('사용자 정보가 없습니다.');

      try {
        if (!files) throw new BadRequestException('파일이 필요합니다.');

        const parsedBody = JSON.parse(updateStudyTeamRequest);
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
    @Patch('/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: '스터디 공고 수정', description: '스터디 공고를 수정합니다.' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: '스터디 공고 수정 요청 데이터',
        schema: {
            type: 'object',
            properties: {
                files: { 
                  type: 'array', 
                  items: { type: 'string', format: 'binary' }, 
                  description: '업로드할 이미지 파일들 (최대 10개의 사진 첨부 가능)' 
                },
                updateStudyTeamRequest: { 
                    type: 'string', 
                    description: '스터디 공고 수정 데이터',
                    example: JSON.stringify({
                        name: "React Study",
                        deleteImages: [1, 2, 3],
                        deleteMembers: [1, 2],
                        studyMember: [{ userId: 3, isLeader: true }]
                    })
                }
            }
        }
    })
    @UseInterceptors(FilesInterceptor('files', 10))
    async updateStudyTeam(
        @Param('id') id: number,
        @Body('updateStudyTeamRequest') updateStudyTeamRequest: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Req() request: any
    ): Promise<any> {
      const user = request.user; 

      try {
        const parsedBody = JSON.parse(updateStudyTeamRequest);
        const updateStudyTeamDto = plainToInstance(UpdateStudyTeamRequest, parsedBody);
        const studyData = await this.studyTeamService.updateStudyTeam(id, user.id, updateStudyTeamDto, files);

        return {
            code: 200,
            message: '스터디 공고가 수정되었습니다.',
            data: studyData,
        };
      } catch (error) {
        this.logger.error('❌ [ERROR] updateStudyTeam 에서 예외 발생: ', error);
        throw error;
      }
    }

    // 스터디 공고 마감(isRecruited: false)
    @Patch('/close/:id/')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: '스터디 공고 마감', description: '스터디 공고의 모집 상태를 마감합니다.' })
    async closeStudyTeam(
        @Param('id') id: number,
        @Req() request: any
    ): Promise<any> {
      const user = request.user; 
      if (!user) throw new BadRequestException('사용자 정보가 없습니다.');

      try {
        const studyData = await this.studyTeamService.closeStudyTeam(id, user.id);

        return {
            code: 200,
            message: '스터디 공고가 마감되었습니다.',
            data: studyData,
        };
      } catch (error) {
        this.logger.error('❌ [ERROR] closeStudyTeam 에서 예외 발생: ', error);
        throw error;
      }
    }

    // 스터디 공고 삭제(토큰검사 O,isDeleted: true)
    @Patch('/delete/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: '스터디 공고 삭제', description: '스터디 공고의 삭제 상태를 true로 변경합니다.' })
    async deleteStudyTeam(
        @Param('id') id: number,
        @Req() request: any
    ): Promise<any> {
        const user = request.user; 
        if (!user) throw new BadRequestException('사용자 정보가 없습니다.');

        try {
            const studyData = await this.studyTeamService.deleteStudyTeam(id, user.id);

            return {
                code: 200,
                message: '스터디 공고가 삭제되었습니다.',
                data: studyData,
            };
        } catch (error) {
            this.logger.error('❌ [ERROR] deleteStudyTeam 에서 예외 발생: ', error);
            throw error;
        }
    }

    // 특정 유저가 참여한 스터디 조회(토큰으로, isDeleted: false만 조회)
    @Get('/user')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: '특정 유저가 참여한 스터디 조회', description: '로그인된 유저가 참여한 스터디 목록을 조회합니다.' })
    async getUserStudyTeams(
        @Req() request: any
    ): Promise<any> {
        const user = request.user; 
        if (!user) throw new BadRequestException('사용자 정보가 없습니다.');

        try {
            const userId = user.id;
            const studyData = await this.studyTeamService.getUserStudyTeams(userId);

            return {
                code: 200,
                message: '참여한 스터디 목록 조회에 성공했습니다.',
                data: studyData,
            };
        } catch (error) {
            this.logger.error('❌ [ERROR] getUserStudyTeams 에서 예외 발생: ', error);
            throw error;
        }
    }

    // 스터디 아이디로 스터디 상세 조회(토큰검사 X)
    @Get('/:id')
    @ApiOperation({ summary: '스터디 상세 조회', description: '스터디 아이디로 스터디 상세 정보를 조회합니다.' })
    async getStudyTeamById(
        @Param('id') id: number
    ): Promise<any> {
        try {
            const studyData = await this.studyTeamService.getStudyTeamById(id);

            return {
                code: 200,
                message: '스터디 상세 조회에 성공했습니다.',
                data: studyData,
            };
        } catch (error) {
            this.logger.error('❌ [ERROR] getStudyTeamById 에서 예외 발생: ', error);
            throw error;
        }
    }

    // 특정 스터디 모든 인원을 조회하는 api(아이디로, 토큰검사 X, 스터디 이름과 인원들의 유저테이블에서 이름:name, 기수:yaer 반환)
    @Get('/:id/members')
    @ApiOperation({ summary: '스터디의 모든 인원 조회', description: '스터디 아이디로 스터디에 속한 모든 인원을 조회합니다.' })
    async getStudyTeamMembersById(
        @Param('id') id: number
    ): Promise<any> {
        try {
            const studyData = await this.studyTeamService.getStudyTeamMembersById(id);

            return {
                code: 200,
                message: '스터디의 모든 인원 조회에 성공했습니다.',
                data: studyData,
            };
        } catch (error) {
            this.logger.error('❌ [ERROR] getStudyTeamMembersById 에서 예외 발생: ', error);
            throw error;
        }
    }
}