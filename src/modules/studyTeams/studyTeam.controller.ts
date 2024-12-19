import {
    Controller,
    Post,
    Body,
    UploadedFiles,
    UseInterceptors,
    UseGuards,
    Req,
    Logger,
    Patch,
    Param,
    Get,
} from '@nestjs/common';
import { StudyTeamService } from './studyTeam.service';
import { CreateStudyTeamRequest } from './dto/request/create.studyTeam.request';
import { UpdateStudyTeamRequest } from './dto/request/update.studyTeam.request';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateStudyMemberRequest } from '../studyMembers/dto/request/create.studyMember.request';
import { UpdateApplicantStatusRequest } from './dto/request/update.applicantStatus.request';
import { AddMemberToStudyTeamRequest } from '../studyMembers/dto/request/add.studyMember.request';
import { NotFoundUserException } from '../../global/exception/custom.exception';

@ApiTags('studyTeams')
@Controller('/studyTeams')
export class StudyTeamController {
    private readonly logger = new Logger(StudyTeamController.name);

    constructor(private readonly studyTeamService: StudyTeamService) {}

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
                    }),
                },
            },
        },
    })
    @UseInterceptors(FilesInterceptor('files', 10)) // 파일 최대 업로드 10개
    async uploadStudyTeam(
        @Body('createStudyTeamRequest') createStudyTeamRequest: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Req() request: any,
    ): Promise<any> {
        const user = request.user;
        if (!user) throw new NotFoundUserException();

        try {
            const parsedBody = JSON.parse(createStudyTeamRequest);
            const createStudyTeamDto = plainToInstance(
                CreateStudyTeamRequest,
                parsedBody,
            );

            const studyData = await this.studyTeamService.createStudyTeam(
                createStudyTeamDto,
                files,
            );

            return {
                code: 201,
                message: '스터디 공고가 생성되었습니다.',
                data: studyData,
            };
        } catch (error) {
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
                    description: '스터디 공고 수정 데이터 (선택사항)',
                    example: JSON.stringify({
                        name: 'React Study',
                        deleteImages: [1, 2, 3],
                        deleteMembers: [1, 2],
                        studyMember: [
                            {
                                userId: 3,
                                isLeader: true,
                            },
                        ],
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
    ): Promise<any> {
        const user = request.user;
        if (!user) throw new NotFoundUserException();

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

            const updateStudyTeamDto = plainToInstance(
                UpdateStudyTeamRequest,
                parsedBody,
            );
            const studyData = await this.studyTeamService.updateStudyTeam(
                studyTeamId,
                user.id,
                updateStudyTeamDto,
                files,
            );

            return {
                code: 200,
                message: '스터디 공고가 수정되었습니다.',
                data: studyData,
            };
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
    ): Promise<any> {
        const user = request.user;

        try {
            const studyData = await this.studyTeamService.closeStudyTeam(
                studyTeamId,
                user.id,
            );
            return {
                code: 200,
                message: '스터디 공고가 마감되었습니다.',
                data: studyData,
            };
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
    ): Promise<any> {
        const user = request.user;
        try {
            const studyData = await this.studyTeamService.deleteStudyTeam(
                studyTeamId,
                user.id,
            );

            return {
                code: 200,
                message: '스터디 공고가 삭제되었습니다.',
                data: studyData,
            };
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
    async getUserStudyTeams(@Req() request: any): Promise<any> {
        const user = request.user;

        try {
            const userId = user.id;
            const studyData =
                await this.studyTeamService.getUserStudyTeams(userId);

            return {
                code: 200,
                message: '참여한 스터디 목록 조회에 성공했습니다.',
                data: studyData,
            };
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
    ): Promise<any> {
        try {
            const studyData =
                await this.studyTeamService.getStudyTeamById(studyTeamId);

            return {
                code: 200,
                message: '스터디 상세 조회에 성공했습니다.',
                data: studyData,
            };
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getStudyTeamById 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    // 특정 스터디 모든 인원을 조회하는 api(아이디로, 토큰검사 X, 스터디 이름과 인원들의 유저테이블에서 이름:name, 기수:yaer 반환)
    @Get('/:studyTeamId/members')
    @ApiOperation({
        summary: '스터디의 모든 인원 조회',
        description: '스터디 아이디로 스터디에 속한 모든 인원을 조회합니다.',
    })
    async getStudyTeamMembersById(
        @Param('studyTeamId') studyTeamId: number,
    ): Promise<any> {
        try {
            const studyData =
                await this.studyTeamService.getStudyTeamMembersById(
                    studyTeamId,
                );

            return {
                code: 200,
                message: '스터디의 모든 인원 조회에 성공했습니다.',
                data: studyData,
            };
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
    ): Promise<any> {
        const user = request.user;
        const userId = user.id;

        const applyData = await this.studyTeamService.applyToStudyTeam(
            createStudyMemberRequest, // 첫 번째 파라미터: 클라이언트가 요청한 데이터
            userId, // 두 번째 파라미터: 서버에서 추가된 사용자 ID
        );

        return {
            code: 201,
            message: '스터디 지원에 성공했습니다.',
            data: applyData,
        };
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
    ): Promise<any> {
        const user = request.user;
        const userId = user.id;

        const cancelData = await this.studyTeamService.cancelApplication(
            studyTeamId,
            userId,
        );
        return {
            code: 200,
            message: '스터디 지원 취소에 성공했습니다.',
            data: cancelData,
        };
    }

    // 스터디 지원자 조회 : status: PENDING인 데이터 조회(스터디팀에 속한 멤버만 조회 가능 멤버가 아니면 확인할 수 없습니다 )
    @UseGuards(JwtAuthGuard)
    @Get('/:studyTeamId/applicants')
    @ApiOperation({
        summary: '스터디 지원자 조회',
        description: '스터디 지원자를 조회합니다.',
    })
    async getApplicants(
        @Param('studyTeamId') studyTeamId: number,
        @Req() request: any,
    ): Promise<any> {
        const userId = request.user.id;
        const applyData = await this.studyTeamService.getApplicants(
            studyTeamId,
            userId,
        );
        return {
            code: 200,
            message: '스터디 지원자 조회에 성공했습니다.',
            data: applyData,
        };
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
    ): Promise<any> {
        const userId = request.user.id; // 현재 요청을 보낸 사용자 (스터디 멤버인지 확인해야 함)
        const { studyTeamId, applicantId } = updateApplicantStatusRequest;
        const data = await this.studyTeamService.acceptApplicant(
            studyTeamId,
            userId,
            applicantId,
        );
        return {
            code: 200,
            message: '스터디 지원을 수락했습니다.',
            data: data,
        };
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
    ): Promise<any> {
        const userId = request.user.id; // 현재 요청을 보낸 사용자 (스터디 멤버인지 확인해야 함)
        const { studyTeamId, applicantId } = updateApplicantStatusRequest;
        const data = await this.studyTeamService.rejectApplicant(
            studyTeamId,
            userId,
            applicantId,
        );
        return {
            code: 200,
            message: '스터디 지원을 거절했습니다.',
            data: data,
        };
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
    ): Promise<any> {
        const userId = request.user.id;
        const { studyTeamId, memberId, isLeader } = addMemberToStudyTeamRequest;
        const data = await this.studyTeamService.addMemberToStudyTeam(
            studyTeamId,
            userId,
            memberId,
            isLeader,
        );
        return {
            code: 201,
            message: '스터디 팀원 추가에 성공했습니다.',
            data: data,
        };
    }
}
