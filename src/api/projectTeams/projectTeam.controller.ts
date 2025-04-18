import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
    ValidationPipe,
} from '@nestjs/common';
import {
    FileFieldsInterceptor,
    FilesInterceptor,
} from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../core/auth/jwt.guard';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { NotFoundUserException } from '../../common/exception/custom.exception';
import { CurrentUser } from '../../common/decorator/user.decorator';
import { RequestUser } from '../../common/dto/users/request/user.interface';

import { AddProjectMemberRequest } from '../../common/dto/projectMembers/request/add.projectMember.request';
import { CreateProjectMemberRequest } from '../../common/dto/projectMembers/request/create.projectMember.request';
import { UpdateProjectApplicantStatusRequest } from '../../common/dto/projectTeams/request/update.applicantStatus.request';
import { CreateProjectTeamRequest } from '../../common/dto/projectTeams/request/create.projectTeam.request';
import { GetTeamQueryRequest } from '../../common/dto/projectTeams/request/get.team.query.request';
import { UpdateProjectTeamRequest } from '../../common/dto/projectTeams/request/update.projectTeam.request';
import { ProjectMemberResponse } from '../../common/dto/projectMembers/response/get.projectMembers.response';
import {
    ProjectApplicantResponse,
    ProjectTeamDetailResponse,
    ProjectTeamListResponse,
} from '../../common/dto/projectTeams/response/get.projectTeam.response';
import { TeamGetAllListResponse } from '../../common/dto/projectTeams/response/get.allTeam.response';

import { ProjectTeamService } from '../../core/projectTeams/projectTeam.service';

import {
    AcceptApplicantDoc,
    AddMemberToProjectTeamDoc,
    ApplyToProjectDoc,
    CancelApplicationDoc,
    CloseProjectDoc,
    CreateProjectDoc,
    DeleteProjectDoc,
    GetAllTeamsDoc,
    GetApplicantsDoc,
    GetProjectByIdDoc,
    GetProjectMembersDoc,
    GetUserProjectsDoc,
    RejectApplicantDoc,
    UpdateProjectDoc,
} from './projectTeam.docs';
import { JsonBodyToDTO } from '../../common/decorator/JsonBodyToDTO';

@ApiTags('projectTeams')
@Controller('/projectTeams')
export class ProjectTeamController {
    constructor(
        private readonly projectTeamService: ProjectTeamService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @CreateProjectDoc()
    @UseInterceptors(FilesInterceptor('files', 10))
    async createProject(
        @JsonBodyToDTO(CreateProjectTeamRequest)
        createProjectTeamRequest: CreateProjectTeamRequest,
        @UploadedFiles() files: Express.Multer.File[],
        @CurrentUser() requestUser: RequestUser,
    ): Promise<ProjectTeamDetailResponse> {
        this.logger.debug(' createProject 엔드포인트 호출');
        if (!requestUser) {
            this.logger.error('사용자 정보가 없습니다.');
            throw new NotFoundUserException();
        }
        this.logger.debug('프로젝트 생성 서비스 호출 시작');
        const createdProject = await this.projectTeamService.createProject(
            createProjectTeamRequest,
            files,
        );
        this.logger.debug('createProject 엔드포인트 성공적으로 완료');
        return createdProject;
    }

    @Get('/allTeams')
    @GetAllTeamsDoc()
    async getAllTeams(
        @Query(new ValidationPipe({ transform: true }))
        getTeamQueryRequest: GetTeamQueryRequest,
    ): Promise<TeamGetAllListResponse> {
        return await this.projectTeamService.getAllTeams(getTeamQueryRequest);
    }

    @Get('/user')
    @UseGuards(JwtAuthGuard)
    @GetUserProjectsDoc()
    async getUserProjects(
        @CurrentUser() requestUser: RequestUser,
    ): Promise<ProjectTeamListResponse[]> {
        const userId = requestUser.id;
        this.logger.debug(`요청한 유저 ID: ${userId}`);
        return await this.projectTeamService.getUserProjects(userId);
    }

    @Get('/:projectTeamId')
    @GetProjectByIdDoc()
    async getProjectById(
        @Param('projectTeamId') projectTeamId: number,
    ): Promise<ProjectTeamDetailResponse> {
        return await this.projectTeamService.getProjectById(projectTeamId);
    }

    @Patch('/:projectTeamId')
    @UseGuards(JwtAuthGuard)
    @UpdateProjectDoc()
    @UseInterceptors(
        FileFieldsInterceptor([
            {
                name: 'mainImages',
                maxCount: 1,
            },
            {
                name: 'resultImages',
                maxCount: 10,
            },
        ]),
    )
    async updateProject(
        @Param('projectTeamId') projectTeamId: number,
        @JsonBodyToDTO(UpdateProjectTeamRequest)
        updateProjectTeamRequest: UpdateProjectTeamRequest,
        @UploadedFiles()
        files: {
            mainImages?: Express.Multer.File[];
            resultImages?: Express.Multer.File[];
        },
        @CurrentUser() requestUser: RequestUser,
    ): Promise<ProjectTeamDetailResponse> {
        if (!requestUser) throw new NotFoundUserException();
        return await this.projectTeamService.updateProjectTeam(
            projectTeamId,
            requestUser.id,
            updateProjectTeamRequest,
            files.mainImages,
            files.resultImages,
        );
    }

    @Patch('/close/:projectTeamId')
    @UseGuards(JwtAuthGuard)
    @CloseProjectDoc()
    async closeProject(
        @Param('projectTeamId') projectTeamId: number,
        @CurrentUser() requestUser: RequestUser,
    ): Promise<ProjectTeamDetailResponse> {
        return await this.projectTeamService.closeProject(
            projectTeamId,
            requestUser.id,
        );
    }

    @Patch('/delete/:projectTeamId')
    @UseGuards(JwtAuthGuard)
    @DeleteProjectDoc()
    async deleteProject(
        @Param('projectTeamId') projectTeamId: number,
        @CurrentUser() requestUser: RequestUser,
    ): Promise<ProjectTeamDetailResponse> {
        return await this.projectTeamService.deleteProject(
            projectTeamId,
            requestUser.id,
        );
    }

    @Get('/:projectTeamId/members')
    @GetProjectMembersDoc()
    async getProjectTeamMembersById(
        @Param('projectTeamId') projectTeamId: number,
    ): Promise<ProjectMemberResponse[]> {
        return await this.projectTeamService.getProjectTeamMembersById(
            projectTeamId,
        );
    }

    @Post('/apply')
    @UseGuards(JwtAuthGuard)
    @ApplyToProjectDoc()
    async applyToProject(
        @Body() createProjectMemberRequest: CreateProjectMemberRequest,
        @CurrentUser() requestUser: RequestUser,
    ): Promise<ProjectApplicantResponse> {
        return await this.projectTeamService.applyToProject(
            createProjectMemberRequest,
            requestUser.id,
        );
    }

    @Patch('/:projectTeamId/cancel')
    @UseGuards(JwtAuthGuard)
    @CancelApplicationDoc()
    async cancelApplication(
        @Param('projectTeamId') projectTeamId: number,
        @CurrentUser() requestUser: RequestUser,
    ): Promise<ProjectMemberResponse> {
        return await this.projectTeamService.cancelApplication(
            projectTeamId,
            requestUser.id,
        );
    }

    @Get('/:projectTeamId/applicants')
    @GetApplicantsDoc()
    async getApplicants(
        @Param('projectTeamId') projectTeamId: number,
    ): Promise<ProjectApplicantResponse[]> {
        return await this.projectTeamService.getApplicants(projectTeamId);
    }

    @Patch('/applicants/accept')
    @UseGuards(JwtAuthGuard)
    @AcceptApplicantDoc()
    async acceptApplicant(
        @Body()
        updateApplicantStatusRequest: UpdateProjectApplicantStatusRequest,
        @CurrentUser() requestUser: RequestUser,
    ): Promise<ProjectApplicantResponse> {
        const { projectTeamId, applicantId } = updateApplicantStatusRequest;
        return await this.projectTeamService.acceptApplicant(
            projectTeamId,
            requestUser.id,
            applicantId,
        );
    }

    @Patch('/applicants/reject')
    @UseGuards(JwtAuthGuard)
    @RejectApplicantDoc()
    async rejectApplicant(
        @Body()
        updateApplicantStatusRequest: UpdateProjectApplicantStatusRequest,
        @CurrentUser() requestUser: RequestUser,
    ): Promise<ProjectApplicantResponse> {
        const { projectTeamId, applicantId } = updateApplicantStatusRequest;
        return await this.projectTeamService.rejectApplicant(
            projectTeamId,
            requestUser.id,
            applicantId,
        );
    }

    @Post('/members')
    @UseGuards(JwtAuthGuard)
    @AddMemberToProjectTeamDoc()
    async addMemberToProjectTeam(
        @Body() addProjectMemberRequest: AddProjectMemberRequest,
        @CurrentUser() requestUser: RequestUser,
    ): Promise<ProjectMemberResponse> {
        return await this.projectTeamService.addMemberToProjectTeam(
            requestUser.id,
            addProjectMemberRequest,
        );
    }
}
