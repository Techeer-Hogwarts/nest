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
import { AddProjectMemberRequest } from '../projectMembers/dto/request/add.projectMember.request';

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
                        name: 'Project Name',
                        githubLink: 'https://github.com/example-project',
                        notionLink: 'https://notion.so/example-project',
                        projectExplain: '프로젝트에 대한 설명입니다.',
                        frontendNum: 2,
                        backendNum: 3,
                        devopsNum: 1,
                        teamStacks: [{ name: 'React.js' }, { name: 'Node.js' }],
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
    ): Promise<any> {
        const user = request.user;

        if (!user) throw new NotFoundUserException();

        try {
            const parsedBody = JSON.parse(createProjectTeamRequest);

            const createdProject = await this.projectTeamService.createProject(
                parsedBody,
                files, // 파일 배열 전달
            );

            return {
                code: 201,
                message: '프로젝트 공고가 생성되었습니다.',
                data: createdProject,
            };
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] createProject 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    @Get('/allTeams')
    @ApiOperation({
        summary: '스터디와 프로젝트 공고 조회',
        description: '스터디와 프로젝트 공고를 한눈에 볼 수 있게 반환합니다.',
    })
    async getAllTeams(): Promise<any> {
        try {
            // 모든 팀 데이터 조회
            const allTeams = await this.projectTeamService.getAllTeams();

            return {
                code: 200,
                message: '스터디와 프로젝트 공고 조회에 성공했습니다.',
                data: allTeams,
            };
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
    async getUserProjects(@Req() request: any): Promise<any> {
        const user = request.user;

        try {
            const userId = user.id;
            this.logger.debug(`🔍 [INFO] 요청한 유저 ID: ${userId}`);
            const projectData =
                await this.projectTeamService.getUserProjects(userId);

            return {
                code: 200,
                message: '참여한 프로젝트 목록 조회에 성공했습니다.',
                data: projectData,
            };
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
    ): Promise<any> {
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

            // 서비스 호출
            const updatedData = await this.projectTeamService.updateProjectTeam(
                projectTeamId,
                user.id,
                updateProjectTeamDto,
                fileUrls, // 업로드된 파일 URL 배열 전달
            );

            return {
                code: 200,
                message: '프로젝트 공고가 수정되었습니다.',
                data: updatedData,
            };
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
    ): Promise<any> {
        const user = request.user;

        try {
            const closedData = await this.projectTeamService.closeProject(
                projectTeamId,
                user.id,
            );

            return {
                code: 200,
                message: '프로젝트 공고가 마감되었습니다.',
                data: closedData,
            };
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
    ): Promise<any> {
        const user = request.user;

        try {
            const deletedData = await this.projectTeamService.deleteProject(
                projectTeamId,
                user.id,
            );

            return {
                code: 200,
                message: '프로젝트 공고가 삭제되었습니다.',
                data: deletedData,
            };
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
    ): Promise<any> {
        try {
            const projectData =
                await this.projectTeamService.getProjectById(projectTeamId);

            return {
                code: 200,
                message: '프로젝트 상세 조회에 성공했습니다.',
                data: projectData,
            };
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
    ): Promise<any> {
        try {
            const projectData =
                await this.projectTeamService.getProjectTeamMembersById(
                    projectTeamId,
                );

            return {
                code: 200,
                message: '프로젝트의 모든 인원 조회에 성공했습니다.',
                data: projectData,
            };
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
    ): Promise<any> {
        const user = request.user;
        const userId = user.id;

        const applyData = await this.projectTeamService.applyToProject(
            createProjectMemberRequest,
            userId,
        );

        return {
            code: 201,
            message: '프로젝트 지원에 성공했습니다.',
            data: applyData,
        };
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
    ): Promise<any> {
        const user = request.user;
        const userId = user.id;

        const cancelData = await this.projectTeamService.cancelApplication(
            projectTeamId,
            userId,
        );
        return {
            code: 200,
            message: '프로젝트 지원 취소에 성공했습니다.',
            data: cancelData,
        };
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
    ): Promise<any> {
        const userId = request.user.id;
        const applyData = await this.projectTeamService.getApplicants(
            projectTeamId,
            userId,
        );
        return {
            code: 200,
            message: '프로젝트 지원자 조회에 성공했습니다.',
            data: applyData,
        };
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
    ): Promise<any> {
        const userId = request.user.id;
        const { projectTeamId, applicantId } = updateApplicantStatusRequest;
        const data = await this.projectTeamService.acceptApplicant(
            projectTeamId,
            userId,
            applicantId,
        );
        return {
            code: 200,
            message: '프로젝트 지원을 수락했습니다.',
            data: data,
        };
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
    ): Promise<any> {
        const userId = request.user.id;
        const { projectTeamId, applicantId } = updateApplicantStatusRequest;
        const data = await this.projectTeamService.rejectApplicant(
            projectTeamId,
            userId,
            applicantId,
        );
        return {
            code: 200,
            message: '프로젝트 지원을 거절했습니다.',
            data: data,
        };
    }

    @Post('/members')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: '프로젝트 팀원 추가',
        description: '프로젝트 팀에 멤버를 추가합니다.',
    })
    async addMemberToProjectTeam(
        @Body() addProjectMemberRequest: AddProjectMemberRequest,
        @Req() request: any,
    ): Promise<any> {
        const userId = request.user.id; // 현재 요청을 보낸 사용자 ID
        const { projectTeamId, memberId, isLeader, teamRole } =
            addProjectMemberRequest;

        try {
            // 사용자가 존재하는지 확인
            const isUserExists =
                await this.projectTeamService.isUserExists(memberId);

            if (!isUserExists) {
                this.logger.warn(
                    `사용자(ID: ${memberId})는 존재하지 않습니다.`,
                );
                throw new Error('추가하려는 사용자가 존재하지 않습니다.');
            }

            // 멤버 추가
            const data = await this.projectTeamService.addMemberToProjectTeam(
                projectTeamId,
                userId, // 요청한 사용자 (팀에 추가 권한이 있는지 확인)
                memberId, // 추가하려는 멤버
                isLeader, // 팀장 여부
                teamRole, // 역할
            );

            return {
                code: 201,
                message: '프로젝트 팀원 추가에 성공했습니다.',
                data: data,
            };
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] addMemberToProjectTeam 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }
}
