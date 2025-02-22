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
import { StudyTeamService } from './studyTeam.service';
import { CreateStudyTeamRequest } from './dto/request/create.studyTeam.request';
import { UpdateStudyTeamRequest } from './dto/request/update.studyTeam.request';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateStudyMemberRequest } from '../studyMembers/dto/request/create.studyMember.request';
import { UpdateApplicantStatusRequest } from './dto/request/update.applicantStatus.request';
import { AddMemberToStudyTeamRequest } from '../studyMembers/dto/request/add.studyMember.request';
import { NotFoundUserException } from '../../global/exception/custom.exception';
import {
    GetStudyTeamResponse,
    StudyApplicantResponse,
    StudyMemberResponse,
} from './dto/response/get.studyTeam.response';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';

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
        @Req() request: any,
    ): Promise<GetStudyTeamResponse> {
        this.logger.debug('🔥 스터디 팀 생성 시작');
        const user = request.user;
        if (!user) {
            this.logger.error('❌ 사용자 정보가 없습니다.');
            throw new NotFoundUserException();
        }
        this.logger.debug(`✅ 사용자 확인됨: ID=${user.id}`);
        try {
            const parsedBody = JSON.parse(createStudyTeamRequest);
            const createStudyTeamDto = plainToInstance(
                CreateStudyTeamRequest,
                parsedBody,
            );

            const result: GetStudyTeamResponse =
                await this.studyTeamService.createStudyTeam(
                    createStudyTeamDto,
                    files,
                );
            this.logger.debug(`생성된 스터디 정보: ${JSON.stringify(result)}`);
            return result;
        } catch (error) {
            this.logger.error('❌ 스터디 팀 생성 중 오류 발생:', error);
            throw error;
        }
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
        @Body('updateStudyTeamRequest')
        updateStudyTeamRequest: string | undefined,
        @UploadedFiles() files: Express.Multer.File[],
        @Req() request: any,
    ): Promise<GetStudyTeamResponse> {
        const user = request.user;
        if (!user) throw new NotFoundUserException();
        this.logger.debug(
            `Starting updateStudyTeam for studyTeamId: ${studyTeamId}, userId: ${user.id}`,
        );

        try {
            let parsedBody = {};

            if (updateStudyTeamRequest) {
                try {
                    parsedBody = JSON.parse(updateStudyTeamRequest);
                } catch (error) {
                    this.logger.warn(
                        '❌ [WARN] JSON 파싱 실패, 빈 객체로 초기화합니다.',
                        error,
                    );
                    parsedBody = {};
                }
            }
            this.logger.debug(`Parsed Body: ${JSON.stringify(parsedBody)}`);

            const updateStudyTeamDto = plainToInstance(
                UpdateStudyTeamRequest,
                parsedBody,
            );
            this.logger.debug(
                `Parsed DTO: ${JSON.stringify(updateStudyTeamDto)}`,
            );
            return await this.studyTeamService.updateStudyTeam(
                studyTeamId,
                user.id,
                updateStudyTeamDto,
                files,
            );
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] updateStudyTeam 에서 예외 발생: ',
                error,
            );
            throw error;
        }
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
        @Req() request: any,
    ): Promise<GetStudyTeamResponse> {
        const user = request.user;

        try {
            return await this.studyTeamService.closeStudyTeam(
                studyTeamId,
                user.id,
            );
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] closeStudyTeam 에서 예외 발생: ',
                error,
            );
            throw error;
        }
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
        @Req() request: any,
    ): Promise<GetStudyTeamResponse> {
        const user = request.user;
        try {
            return await this.studyTeamService.deleteStudyTeam(
                studyTeamId,
                user.id,
            );
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] deleteStudyTeam 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    // 특정 유저가 참여한 스터디 조회(토큰으로, isDeleted: false만 조회)
    @Get('/user')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '특정 유저가 참여한 스터디 조회',
        description: '로그인된 유저가 참여한 스터디 목록을 조회합니다.',
    })
    async getUserStudyTeams(
        @Req() request: any,
    ): Promise<GetStudyTeamResponse[]> {
        const user = request.user;

        try {
            const userId = user.id;
            return await this.studyTeamService.getUserStudyTeams(userId);
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getUserStudyTeams 에서 예외 발생: ',
                error,
            );
            throw error;
        }
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
        try {
            return await this.studyTeamService.getStudyTeamById(studyTeamId);
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getStudyTeamById 에서 예외 발생: ',
                error,
            );
            throw error;
        }
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
        try {
            return await this.studyTeamService.getStudyTeamMembersById(
                studyTeamId,
            );
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getStudyTeamMembersById 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    @Post('/apply')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '스터디 지원',
        description: '스터디에 지원합니다.',
    })
    async applyToStudyTeam(
        @Body() createStudyMemberRequest: CreateStudyMemberRequest,
        @Req() request: any,
    ): Promise<StudyApplicantResponse> {
        try {
            this.logger.debug(JSON.stringify(createStudyMemberRequest));
            this.logger.debug('🔥 스터디 지원 시작');
            const user = request.user;
            this.logger.debug(`요청 데이터: userId=${user.id}`);

            const result = await this.studyTeamService.applyToStudyTeam(
                createStudyMemberRequest,
                user,
            );

            this.logger.debug('✅ 스터디 지원 완료');
            return result;
        } catch (error) {
            this.logger.error(JSON.stringify(createStudyMemberRequest));
            this.logger.error('❌ 스터디 지원 중 오류 발생:', error);
            throw error;
        }
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
        @Req() request: any,
    ): Promise<StudyMemberResponse> {
        const user = request.user;

        return await this.studyTeamService.cancelApplication(studyTeamId, user);
    }

    // 스터디 지원자 조회 : status: PENDING인 데이터 조회(스터디팀에 속한 멤버만 조회 가능 멤버가 아니면 확인할 수 없습니다 )
    // @UseGuards(JwtAuthGuard)
    @Get('/:studyTeamId/applicants')
    @ApiOperation({
        summary: '스터디 지원자 조회',
        description: '스터디 지원자를 조회합니다.',
    })
    async getApplicants(
        @Param('studyTeamId') studyTeamId: number,
        // @Req() request: any,
    ): Promise<StudyApplicantResponse[]> {
        // this.logger.debug(
        //     `🔥 스터디 지원자 조회 시작 - studyTeamId: ${studyTeamId}, userId: ${request.user.id}`,
        // );
        try {
            // const userId = request.user.id;
            const applicants = await this.studyTeamService.getApplicants(
                studyTeamId,
                // userId,
            );
            this.logger.debug(
                `✅ 스터디 지원자 조회 완료 - studyTeamId: ${studyTeamId}, applicantsCount: ${applicants.length}`,
            );
            return applicants;
        } catch (error) {
            this.logger.error(
                `❌ 스터디 지원자 조회 실패 - studyTeamId: ${studyTeamId}, error: ${error.message}`,
            );
            throw error;
        }
    }

    // 🔥 스터디 지원자 승인 API
    @Patch('/applicants/accept')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '스터디 지원 수락',
        description: '스터디 지원을 수락합니다.',
    })
    @ApiBody({ type: UpdateApplicantStatusRequest })
    async acceptApplicant(
        @Body() updateApplicantStatusRequest: UpdateApplicantStatusRequest,
        @Req() request: any,
    ): Promise<StudyApplicantResponse> {
        const user = request.user; // 현재 요청을 보낸 사용자 (스터디 멤버인지 확인해야 함)
        const { studyTeamId, applicantId } = updateApplicantStatusRequest;
        this.logger.debug(
            `스터디 지원 수락 요청 수신 - User: ${user.id}, StudyTeam: ${studyTeamId}, Applicant: ${applicantId}`,
        );
        try {
            const response = await this.studyTeamService.acceptApplicant(
                studyTeamId,
                user,
                applicantId,
            );

            this.logger.log(
                `스터디 지원 수락 완료 - StudyTeam: ${studyTeamId}, Applicant: ${applicantId}`,
            );

            return response;
        } catch (error) {
            this.logger.error(
                `스터디 지원 수락 실패 - StudyTeam: ${studyTeamId}, Applicant: ${applicantId}, Error: ${error.message}`,
            );
            throw error;
        }
    }

    // 🔥 스터디 지원자 거절 API
    @Patch('/applicants/reject')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '스터디 지원 거절',
        description: '스터디 지원을 거절합니다.',
    })
    @ApiBody({ type: UpdateApplicantStatusRequest })
    async rejectApplicant(
        @Body() updateApplicantStatusRequest: UpdateApplicantStatusRequest,
        @Req() request: any,
    ): Promise<StudyApplicantResponse> {
        const userId = request.user.id;
        const { studyTeamId, applicantId } = updateApplicantStatusRequest;
        this.logger.debug(
            `🔥 스터디 지원 거절 요청 - studyTeamId: ${studyTeamId}, userId: ${userId}, applicantId: ${applicantId}`,
        );
        try {
            const result = await this.studyTeamService.rejectApplicant(
                studyTeamId,
                userId,
                applicantId,
            );
            this.logger.debug(
                `✅ 스터디 지원 거절 완료 - studyTeamId: ${studyTeamId}, applicantId: ${applicantId}`,
            );
            return result;
        } catch (error) {
            this.logger.error(
                `❌ 스터디 지원 거절 실패 - studyTeamId: ${studyTeamId}, applicantId: ${applicantId}, error: ${error.message}`,
            );
            throw error;
        }
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
        @Req() request: any,
    ): Promise<StudyMemberResponse> {
        const userId = request.user.id;
        const { studyTeamId, memberId, isLeader } = addMemberToStudyTeamRequest;
        this.logger.debug(
            `🔥 스터디 팀원 추가 요청 - studyTeamId: ${studyTeamId}, userId: ${userId}, memberId: ${memberId}, isLeader: ${isLeader}`,
        );
        try {
            const result = await this.studyTeamService.addMemberToStudyTeam(
                studyTeamId,
                userId,
                memberId,
                isLeader,
            );
            this.logger.debug(
                `✅ 스터디 팀원 추가 완료 - studyTeamId: ${studyTeamId}, memberId: ${memberId}, isLeader: ${isLeader}`,
            );
            return result;
        } catch (error) {
            this.logger.error(
                `❌ 스터디 팀원 추가 실패 - studyTeamId: ${studyTeamId}, memberId: ${memberId}, error: ${error.message}`,
            );
            throw error;
        }
    }
}
