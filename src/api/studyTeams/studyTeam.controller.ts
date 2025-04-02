import {
    Controller,
    Post,
    Body,
    UploadedFiles,
    UseInterceptors,
    UseGuards,
    Req,
    Patch,
    Param,
    Get,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';

import { StudyTeamService } from '../../core/studyTeams/studyTeam.service';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { JwtAuthGuard } from '../../core/auth/jwt.guard';
import {
    GetStudyTeamResponse,
    StudyApplicantResponse,
    StudyMemberResponse,
} from '../../common/dto/studyTeams/response/get.studyTeam.response';
import { StudyTeamInvalidUserException } from '../../core/studyTeams/exception/studyTeam.exception';

import { CreateStudyMemberRequest } from '../../common/dto/studyMembers/request/create.studyMember.request';
import { UpdateApplicantStatusRequest } from '../../common/dto/studyTeams/request/update.applicantStatus.request';
import { AddMemberToStudyTeamRequest } from '../../common/dto/studyMembers/request/add.studyMember.request';
import { plainToInstance } from 'class-transformer';
import { UpdateStudyTeamRequest } from '../../common/dto/studyTeams/request/update.studyTeam.request';
import { CreateStudyTeamRequest } from '../../common/dto/studyTeams/request/create.studyTeam.request';
import { validateDtoFields } from '../../common/validation/plainDto.validation';
@ApiTags('studyTeams')
@Controller('/studyTeams')
export class StudyTeamController {
    constructor(
        private readonly studyTeamService: StudyTeamService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @Post() // 슬랙봇 연동 추가될 예정
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '스터디 공고 생성',
        description: '새로운 스터디 공고를 생성합니다.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: '스터디 공고 생성 요청 데이터',
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                    description: '업로드할 이미지 파일들 (여러개 가능)',
                },
                createStudyTeamRequest: {
                    type: 'string',
                    description: '스터디 공고 데이터',
                    example: JSON.stringify({
                        name: 'React Study',
                        githubLink: 'https://github.com/example-study',
                        notionLink: 'https://notion.so/example-study',
                        studyExplain:
                            '리액트 서적을 읽고 함께 학습하는 스터디입니다.',
                        goal: '두 달 안에 리액트 서적 완독',
                        rule: '매주 일요일 오후 2시에 온라인으로 진행',
                        isFinished: false,
                        isRecruited: true,
                        recruitNum: 5,
                        recruitExplain:
                            '시간 약속을 잘 지키는 사람과 함께하고 싶습니다.',
                        studyMember: [
                            {
                                userId: 1,
                                isLeader: true,
                            },
                        ],
                        profileImage: 'profileImage.jpg',
                    }),
                },
            },
        },
    })
    @UseInterceptors(FilesInterceptor('files', 10))
    async uploadStudyTeam(
        @Body('createStudyTeamRequest') createStudyTeamRequest: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Req() request: Request,
    ): Promise<GetStudyTeamResponse> {
        this.logger.debug('스터디 팀 생성 시작');

        const user = request.user as { id: number };
        if (!user) {
            throw new StudyTeamInvalidUserException();
        }
        this.logger.debug('스터디 팀 생성: request user 확인 완료');

        const createRequest = plainToInstance(
            CreateStudyTeamRequest,
            JSON.parse(createStudyTeamRequest),
        );
        await validateDtoFields(createRequest);
        this.logger.debug('스터디 팀 생성: body dto 검증 완료');

        return await this.studyTeamService.createStudyTeam(
            createRequest,
            files,
        );
    }

    @Patch('/:studyTeamId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '스터디 공고 수정',
        description: '스터디 공고를 수정합니다.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: '스터디 공고 수정 요청 데이터',
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                    description:
                        '업로드할 이미지 파일들 (최대 10개의 사진 첨부 가능)',
                },
                updateStudyTeamRequest: {
                    type: 'string',
                    description: '스터디 공고 수정 데이터',
                    example: JSON.stringify({
                        name: 'React Study',
                        githubLink: 'https://github.com/example-study',
                        notionLink: 'https://notion.so/example-study',
                        studyExplain: '코딩테스트 공부하는 스터디입니다.',
                        goal: '두 달 안에 코딩의 신',
                        rule: '매주 일요일 오후 2시에 온라인으로 진행',
                        isFinished: false,
                        isRecruited: true,
                        recruitNum: 5,
                        recruitExplain:
                            '시간 약속을 잘 지키는 사람과 함께하고 싶습니다.',
                        studyMember: [
                            {
                                userId: 2,
                                isLeader: true,
                            },
                        ],
                        deleteImages: [1],
                        deleteMembers: [1, 2],
                    }),
                },
            },
        },
    })
    @UseInterceptors(FilesInterceptor('files', 10))
    async updateStudyTeam(
        @Param('studyTeamId') studyTeamId: number,
        @Body('updateStudyTeamRequest') updateStudyTeamRequest: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Req() request: Request,
    ): Promise<GetStudyTeamResponse> {
        this.logger.debug('스터디 팀 업데이트 시작');

        const user = request.user as { id: number };
        if (!user) {
            throw new StudyTeamInvalidUserException();
        }
        this.logger.debug('스터디 팀 업데이트: request user 확인 완료');

        const updateRequest = plainToInstance(
            UpdateStudyTeamRequest,
            JSON.parse(updateStudyTeamRequest),
        );
        await validateDtoFields(updateRequest);
        this.logger.debug('스터디 팀 업데이트: body dto 확인 완료');

        return await this.studyTeamService.updateStudyTeam(
            studyTeamId,
            user.id,
            updateRequest,
            files,
        );
    }

    // 스터디 공고 마감(isRecruited: false)
    @Patch('/close/:studyTeamId/')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '스터디 공고 마감',
        description: '스터디 공고의 모집 상태를 마감합니다.',
    })
    async closeStudyTeam(
        @Param('studyTeamId') studyTeamId: number,
        @Req() request: Request,
    ): Promise<GetStudyTeamResponse> {
        this.logger.debug('스터디 팀 모집 마감 시작');
        const user = request.user as { id: number };
        return await this.studyTeamService.closeStudyTeam(studyTeamId, user.id);
    }

    // 스터디 공고 삭제(토큰검사 O,isDeleted: true)
    @Patch('/delete/:studyTeamId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '스터디 공고 삭제',
        description: '스터디 공고의 삭제 상태를 true로 변경합니다.',
    })
    async deleteStudyTeam(
        @Param('studyTeamId') studyTeamId: number,
        @Req() request: Request,
    ): Promise<GetStudyTeamResponse> {
        this.logger.debug('스터디 팀 삭제 시작');
        const user = request.user as { id: number };
        return await this.studyTeamService.deleteStudyTeam(
            studyTeamId,
            user.id,
        );
    }

    // 특정 유저가 참여한 스터디 조회(토큰으로, isDeleted: false만 조회)
    @Get('/user')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '특정 유저가 참여한 스터디 조회',
        description: '로그인된 유저가 참여한 스터디 목록을 조회합니다.',
    })
    async getUserStudyTeams(
        @Req() request: Request,
    ): Promise<GetStudyTeamResponse[]> {
        this.logger.debug('특정 유저가 참여한 스터디 조회 시작');
        const user = request.user as { id: number };
        return await this.studyTeamService.getUserStudyTeams(user.id);
    }

    // 스터디 아이디로 스터디 상세 조회(토큰검사 X)
    @Get('/:studyTeamId')
    @ApiOperation({
        summary: '스터디 상세 조회',
        description: '스터디 아이디로 스터디 상세 정보를 조회합니다.',
    })
    async getStudyTeamById(
        @Param('studyTeamId') studyTeamId: number,
    ): Promise<GetStudyTeamResponse> {
        this.logger.debug('스터디 팀 상세 조회 시작');
        return await this.studyTeamService.getStudyTeamById(studyTeamId);
    }

    // 특정 스터디 모든 인원을 조회하는 api(아이디로, 토큰검사 X, 스터디 이름과 인원들의 유저테이블에서 이름:name, 리더여부)
    @Get('/:studyTeamId/members')
    @ApiOperation({
        summary: '스터디의 모든 인원 조회',
        description: '스터디 아이디로 스터디에 속한 모든 인원을 조회합니다.',
    })
    async getStudyTeamMembersById(
        @Param('studyTeamId') studyTeamId: number,
    ): Promise<StudyMemberResponse[]> {
        this.logger.debug('스터디의 모든 인원 조회 시작');
        return await this.studyTeamService.getStudyTeamMembersById(studyTeamId);
    }

    @Post('/apply')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '스터디 지원',
        description: '스터디에 지원합니다.',
    })
    async applyToStudyTeam(
        @Body() createStudyMemberRequest: CreateStudyMemberRequest,
        @Req() request: Request,
    ): Promise<StudyApplicantResponse> {
        this.logger.debug('스터디 팀 지원 시작');
        const user = request.user as { id: number; email: string };
        return await this.studyTeamService.applyToStudyTeam(
            createStudyMemberRequest,
            user,
        );
    }

    // 스터디 지원 취소 : isDeleted = true(지원한 사람만 가능)
    @Patch('/:studyTeamId/cancel')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '스터디 지원 취소',
        description: '스터디 지원을 취소합니다.',
    })
    async cancelApplication(
        @Param('studyTeamId') studyTeamId: number,
        @Req() request: Request,
    ): Promise<StudyMemberResponse> {
        this.logger.debug('스터디 팀 지원 취소 시작');
        const user = request.user as { id: number; email: string };
        return await this.studyTeamService.cancelApplication(studyTeamId, user);
    }

    // @UseGuards(JwtAuthGuard)
    @Get('/:studyTeamId/applicants')
    @ApiOperation({
        summary: '스터디 지원자 조회',
        description: '스터디 지원자를 조회합니다.',
    })
    async getApplicants(
        @Param('studyTeamId') studyTeamId: number,
    ): Promise<StudyApplicantResponse[]> {
        this.logger.debug('스터디 팀 지원자 조회 시작');
        return await this.studyTeamService.getApplicants(studyTeamId);
    }

    // 스터디 지원자 승인 API
    @Patch('/applicants/accept')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '스터디 지원 수락',
        description: '스터디 지원을 수락합니다.',
    })
    @ApiBody({ type: UpdateApplicantStatusRequest })
    async acceptApplicant(
        @Body() updateApplicantStatusRequest: UpdateApplicantStatusRequest,
        @Req() request: Request,
    ): Promise<StudyApplicantResponse> {
        this.logger.debug('스터디 팀 지원자 수락 시작');
        return await this.studyTeamService.acceptApplicant(
            updateApplicantStatusRequest.studyTeamId,
            request.user as { id: number; email: string },
            updateApplicantStatusRequest.applicantId,
        );
    }

    // 스터디 지원자 거절 API
    @Patch('/applicants/reject')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '스터디 지원 거절',
        description: '스터디 지원을 거절합니다.',
    })
    @ApiBody({ type: UpdateApplicantStatusRequest })
    async rejectApplicant(
        @Body() updateApplicantStatusRequest: UpdateApplicantStatusRequest,
        @Req() request: Request,
    ): Promise<StudyApplicantResponse> {
        this.logger.debug('스터디 팀 지원자 거절 시작');
        return await this.studyTeamService.rejectApplicant(
            updateApplicantStatusRequest.studyTeamId,
            request.user as { id: number },
            updateApplicantStatusRequest.applicantId,
        );
    }

    // 스터디 팀원 추가 기능 : status: APPROVED인 데이터 추가(스터디팀에 속한 멤버만 가능)
    @Post('/members')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '스터디 팀원 추가',
        description: '스터디 팀에 멤버를 추가합니다.',
    })
    async addMemberToStudyTeam(
        @Body() addMemberToStudyTeamRequest: AddMemberToStudyTeamRequest,
        @Req() request: Request,
    ): Promise<StudyMemberResponse> {
        this.logger.debug('스터디 팀원 추가 시작');
        const user = request.user as { id: number };
        return await this.studyTeamService.addMemberToStudyTeam(
            addMemberToStudyTeamRequest.studyTeamId,
            user.id,
            addMemberToStudyTeamRequest.memberId,
            addMemberToStudyTeamRequest.isLeader,
        );
    }
}
