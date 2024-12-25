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
import { CreateProjectTeamRequest } from './dto/request/create.projectTeam.request';
import { UpdateProjectTeamRequest } from './dto/request/update.projectTeam.request';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { FilesInterceptor } from '@nestjs/platform-express';
import { NotFoundUserException } from '../../global/exception/custom.exception';

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
                    description: '업로드할 이미지 파일들 (여러개 가능)',
                },
                createProjectTeamRequest: {
                    type: 'string',
                    description: '프로젝트 공고 데이터',
                    example: JSON.stringify({
                        name: 'Project Name',
                        githubLink: 'https://github.com/example-project',
                        notionLink: 'https://notion.so/example-project',
                        projectExplain: '프로젝트에 대한 설명입니다.',
                        isFinished: false,
                        isRecruited: true,
                        recruitExplain:
                            '시간 약속을 잘 지키는 사람과 함께하고 싶습니다.',
                        projectMember: [
                            {
                                userId: 1,
                                isLeader: true,
                                teamRole: 'Frontend Developer',
                            },
                        ],
                    }),
                },
            },
        },
    })
    @UseInterceptors(FilesInterceptor('files', 10))
    async createProject(
        @Body('createProjectTeamRequest') createProjectTeamRequest: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Req() request: any,
    ): Promise<any> {
        const user = request.user;
        if (!user) throw new NotFoundUserException();

        try {
            const parsedBody = JSON.parse(createProjectTeamRequest);
            const createProjectTeamDto = plainToInstance(
                CreateProjectTeamRequest,
                parsedBody,
            );

            const projectData =
                await this.projectTeamService.createProject(
                    createProjectTeamDto,
                );

            return {
                code: 201,
                message: '프로젝트 공고가 생성되었습니다.',
                data: projectData,
            };
        } catch (error) {
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

            // 파일 경로 추출
            const filePaths: string[] = files.map((file) => file.path);

            // 서비스 호출 시 파일 경로 배열 전달
            const updatedData = await this.projectTeamService.updateProjectTeam(
                projectTeamId,
                user.id,
                updateProjectTeamDto,
                filePaths, // 파일 경로 배열 전달
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
}
