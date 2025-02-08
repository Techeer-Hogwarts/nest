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
import { ProjectTeamService } from './projectTeam.service';
import { UpdateProjectTeamRequest } from './dto/request/update.projectTeam.request';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { FilesInterceptor } from '@nestjs/platform-express';
import { NotFoundUserException } from '../../global/exception/custom.exception';
import { CreateProjectMemberRequest } from '../projectMembers/dto/request/create.projectMember.request';
import { UpdateApplicantStatusRequest } from './dto/request/update.applicantStatus.request';
import {
    ProjectApplicantResponse,
    ProjectMemberResponse,
    ProjectTeamDetailResponse,
    ProjectTeamListResponse,
} from './dto/response/get.projectTeam.response';

@ApiTags('projectTeams')
@Controller('/projectTeams')
export class ProjectTeamController {
    private readonly logger = new Logger(ProjectTeamController.name);

    constructor(private readonly projectTeamService: ProjectTeamService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '프로젝트 공고 생성',
        description: '새로운 프로젝트 공고를 생성합니다.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: '프로젝트 공고 생성 요청 데이터',
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                    description: '업로드할 이미지 파일들',
                },
                createProjectTeamRequest: {
                    type: 'string',
                    description: '프로젝트 공고 데이터',
                    example: JSON.stringify({
                        name: '프로젝트 이름',
                        projectExplain: '프로젝트에 대한 설명입니다.',
                        frontendNum: 1,
                        backendNum: 1,
                        devopsNum: 0,
                        uiuxNum: 0,
                        dataEngineerNum: 0,
                        isRecruited: true,
                        isFinished: false,
                        recruitExplain:
                            '시간 약속을 잘 지키는 사람을 원합니다.',
                        githubLink: 'https://github.com/techeerism',
                        notionLink: 'https://notion.so/techeerism',
                        projectMember: [
                            {
                                userId: 1,
                                isLeader: true,
                                teamRole: 'Frontend',
                            },
                        ],
                        teamStacks: [
                            {
                                stack: 'React.js',
                                isMain: true,
                            },
                            {
                                stack: 'Node.js',
                                isMain: false,
                            },
                        ],
                    }),
                },
            },
        },
    })
    @UseInterceptors(FilesInterceptor('files', 10)) // 파일 업로드 허용
    async createProject(
        @Body('createProjectTeamRequest') createProjectTeamRequest: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Req() request: any,
    ): Promise<ProjectTeamDetailResponse> {
        this.logger.debug('🔥 [START] createProject 엔드포인트 호출');
        const user = request.user;
        if (!user) {
            this.logger.error('❌ 사용자 정보가 없습니다.');
            throw new NotFoundUserException();
        }
        this.logger.debug(`✅ 사용자 확인됨: ID=${user.id}`);

        try {
            this.logger.debug('📄 요청 본문(JSON) 파싱 시작');
            const parsedBody = JSON.parse(createProjectTeamRequest);
            this.logger.debug('📄 요청 본문 파싱 완료');
            this.logger.debug(`요청 데이터: ${JSON.stringify(parsedBody)}`);

            const mainImages = files?.length > 0 ? files[0] : null;
            const resultImages = files?.length > 1 ? files.slice(1) : [];
            this.logger.debug(`받은 파일 개수: ${files?.length || 0}`);

            if (mainImages) {
                this.logger.debug('메인 이미지가 존재합니다.');
            } else {
                this.logger.error('❌ 메인 이미지가 누락되었습니다.');
            }
            this.logger.debug(`결과 이미지 파일 수: ${resultImages.length}`);

            this.logger.debug('🚀 프로젝트 생성 서비스 호출 시작');
            const createdProject = await this.projectTeamService.createProject(
                {
                    ...parsedBody,
                    mainImages,
                    resultImages,
                },
                files,
            );
            this.logger.debug('🚀 프로젝트 생성 서비스 호출 완료');
            this.logger.debug(`생성된 프로젝트 ID: ${createdProject.id}`);

            this.logger.debug('✅ createProject 엔드포인트 성공적으로 완료');
            return createdProject;
        } catch (error) {
            this.logger.error('❌ [ERROR] createProject에서 예외 발생:', error);
            throw error;
        }
    }

    @Get('/allTeams')
    @ApiOperation({
        summary: '스터디와 프로젝트 공고 조회',
        description: '스터디와 프로젝트 공고를 한눈에 볼 수 있게 반환합니다.',
    })
    async getAllTeams(): Promise<ProjectTeamListResponse[]> {
        try {
            // 모든 팀 데이터 조회
            return await this.projectTeamService.getAllTeams();
        } catch (error) {
            this.logger.error('❌ [ERROR] getAllTeams 에서 예외 발생: ', error);
            throw error;
        }
    }

    // 특정 유저가 참여한 프로젝트 조회(토큰으로, isDeleted: false만 조회)
    @Get('/user')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '특정 유저가 참여한 프로젝트 조회',
        description: '로그인된 유저가 참여한 프로젝트 목록을 조회합니다.',
    })
    async getUserProjects(
        @Req() request: any,
    ): Promise<ProjectTeamListResponse[]> {
        const user = request.user;

        try {
            const userId = user.id;
            this.logger.debug(`🔍 [INFO] 요청한 유저 ID: ${userId}`);

            return await this.projectTeamService.getUserProjects(userId);
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getUserProjects 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    @Patch('/:projectTeamId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '프로젝트 공고 수정',
        description: '프로젝트 공고를 수정합니다.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: '프로젝트 공고 수정 요청 데이터',
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
                updateProjectTeamRequest: {
                    type: 'string',
                    description: '프로젝트 공고 수정 데이터 (선택사항)',
                    example: JSON.stringify({
                        name: 'Updated Project Name',
                        projectExplain: '프로젝트에 대한 수정된 설명입니다.',
                        deleteImages: [1, 2, 3],
                        projectMember: [
                            {
                                userId: 2,
                                isLeader: false,
                                teamRole: 'Backend Developer',
                            },
                        ],
                    }),
                },
            },
        },
    })
    @UseInterceptors(FilesInterceptor('files', 10)) // 최대 10개의 파일 업로드 허용
    async updateProject(
        @Param('projectTeamId') projectTeamId: number,
        @Body('updateProjectTeamRequest') updateProjectTeamRequest: string,
        @UploadedFiles() files: Express.Multer.File[], // Multer 파일 배열
        @Req() request: any,
    ): Promise<ProjectTeamDetailResponse> {
        const user = request.user;
        if (!user) throw new NotFoundUserException();

        try {
            // 요청 데이터 파싱
            const parsedBody = JSON.parse(updateProjectTeamRequest);
            const updateProjectTeamDto = plainToInstance(
                UpdateProjectTeamRequest,
                parsedBody,
            );

            // 파일 업로드 및 URL 생성
            const fileUrls = await this.projectTeamService.uploadImagesToS3(
                files,
                'project-teams',
            );

            return await this.projectTeamService.updateProjectTeam(
                projectTeamId,
                user.id,
                updateProjectTeamDto,
                fileUrls, // 업로드된 파일 URL 배열 전달
            );
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] updateProjectTeam 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    @Patch('/close/:projectTeamId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '프로젝트 공고 마감',
        description: '프로젝트 공고의 모집 상태를 마감합니다.',
    })
    async closeProject(
        @Param('projectTeamId') projectTeamId: number,
        @Req() request: any,
    ): Promise<ProjectTeamDetailResponse> {
        const user = request.user;

        try {
            return await this.projectTeamService.closeProject(
                projectTeamId,
                user.id,
            );
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] closeProject 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    @Patch('/delete/:projectTeamId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '프로젝트 공고 삭제',
        description: '프로젝트 공고의 삭제 상태를 true로 변경합니다.',
    })
    async deleteProject(
        @Param('projectTeamId') projectTeamId: number,
        @Req() request: any,
    ): Promise<ProjectTeamDetailResponse> {
        const user = request.user;

        try {
            return await this.projectTeamService.deleteProject(
                projectTeamId,
                user.id,
            );
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] deleteProject 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    @Get('/:projectTeamId')
    @ApiOperation({
        summary: '프로젝트 상세 조회',
        description: '프로젝트 아이디로 프로젝트 상세 정보를 조회합니다.',
    })
    async getProjectById(
        @Param('projectTeamId') projectTeamId: number,
    ): Promise<ProjectTeamDetailResponse> {
        try {
            return await this.projectTeamService.getProjectById(projectTeamId);
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getProjectById 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    // 특정 프로젝트 모든 인원을 조회하는 API (아이디로, 토큰검사 X)
    @Get('/:projectTeamId/members')
    @ApiOperation({
        summary: '프로젝트의 모든 인원 조회',
        description:
            '프로젝트 아이디로 프로젝트에 속한 모든 인원을 조회합니다.',
    })
    async getProjectTeamMembersById(
        @Param('projectTeamId') projectTeamId: number,
    ): Promise<ProjectMemberResponse[]> {
        try {
            return await this.projectTeamService.getProjectTeamMembersById(
                projectTeamId,
            );
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getProjectTeamMembersById 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    @Post('/apply')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '프로젝트 지원',
        description: '프로젝트에 지원합니다.',
    })
    async applyToProject(
        @Body() createProjectMemberRequest: CreateProjectMemberRequest,
        @Req() request: any,
    ): Promise<ProjectApplicantResponse> {
        const user = request.user;
        const userId = user.id;

        return await this.projectTeamService.applyToProject(
            createProjectMemberRequest,
            userId,
        );
    }

    // 프로젝트 지원 취소 : isDeleted = true
    @Patch('/:projectTeamId/cancel')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '프로젝트 지원 취소',
        description: '프로젝트 지원을 취소합니다.',
    })
    async cancelApplication(
        @Param('projectTeamId') projectTeamId: number,
        @Req() request: any,
    ): Promise<ProjectMemberResponse> {
        const user = request.user;
        const userId = user.id;

        return await this.projectTeamService.cancelApplication(
            projectTeamId,
            userId,
        );
    }

    // 프로젝트 지원자 조회 : status: PENDING인 데이터 조회
    @UseGuards(JwtAuthGuard)
    @Get('/:projectTeamId/applicants')
    @ApiOperation({
        summary: '프로젝트 지원자 조회',
        description: '프로젝트 지원자를 조회합니다.',
    })
    async getApplicants(
        @Param('projectTeamId') projectTeamId: number,
        @Req() request: any,
    ): Promise<ProjectApplicantResponse[]> {
        const userId = request.user.id;
        return await this.projectTeamService.getApplicants(
            projectTeamId,
            userId,
        );
    }

    // 프로젝트 지원자 승인
    @Patch('/applicants/accept')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '프로젝트 지원 수락',
        description: '프로젝트 지원을 수락합니다.',
    })
    @ApiBody({ type: UpdateApplicantStatusRequest })
    async acceptApplicant(
        @Body() updateApplicantStatusRequest: UpdateApplicantStatusRequest,
        @Req() request: any,
    ): Promise<ProjectApplicantResponse> {
        const userId = request.user.id;
        const { projectTeamId, applicantId } = updateApplicantStatusRequest;
        return await this.projectTeamService.acceptApplicant(
            projectTeamId,
            userId,
            applicantId,
        );
    }

    // 프로젝트 지원자 거절
    @Patch('/applicants/reject')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '프로젝트 지원 거절',
        description: '프로젝트 지원을 거절합니다.',
    })
    @ApiBody({ type: UpdateApplicantStatusRequest })
    async rejectApplicant(
        @Body() updateApplicantStatusRequest: UpdateApplicantStatusRequest,
        @Req() request: any,
    ): Promise<ProjectApplicantResponse> {
        const userId = request.user.id;
        const { projectTeamId, applicantId } = updateApplicantStatusRequest;
        return await this.projectTeamService.rejectApplicant(
            projectTeamId,
            userId,
            applicantId,
        );
    }

    @Post('/members')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '프로젝트 팀원 추가',
        description: '프로젝트 팀에 멤버를 추가합니다.',
    })
    async addMemberToProjectTeam(
        projectTeamId: number,
        requesterId: number,
        memberId: number,
        isLeader: boolean,
        teamRole: string,
    ): Promise<ProjectMemberResponse> {
        try {
            this.logger.debug('🔥 팀원 추가 시작');
            const isRequesterExists =
                await this.projectTeamService.isUserExists(requesterId);
            if (!isRequesterExists) {
                throw new Error(
                    `요청자(ID: ${requesterId})가 존재하지 않습니다.`,
                );
            }

            const newMember = await this..projectMember.create({
                data: {
                    projectTeam: { connect: { id: projectTeamId } },
                    user: { connect: { id: memberId } },
                    isLeader,
                    teamRole,
                    status: 'APPROVED',
                },
                include: {
                    user: {
                        select: { name: true },
                    },
                },
            });

            this.logger.debug(`✅ 팀원 추가 완료 (ID: ${memberId})`);
            return new ProjectMemberResponse(newMember);
        } catch (error) {
            this.logger.error('❌ 팀원 추가 중 예외 발생:', error);
            throw error;
        }
    }
}
