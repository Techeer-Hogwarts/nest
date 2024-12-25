import { Injectable, Logger } from '@nestjs/common';
import { ProjectTeamRepository } from './repository/projectTeam.repository';
import { CreateProjectTeamRequest } from './dto/request/create.projectTeam.request';
import { UpdateProjectTeamRequest } from './dto/request/update.projectTeam.request';
import { NotFoundProjectException } from '../../global/exception/custom.exception';

@Injectable()
export class ProjectTeamService {
    private readonly logger = new Logger(ProjectTeamService.name);

    constructor(
        private readonly projectTeamRepository: ProjectTeamRepository,
    ) {}

    async ensureUserIsProjectMember(
        projectTeamId: number,
        userId: number,
    ): Promise<void> {
        try {
            const isMember =
                await this.projectTeamRepository.isUserMemberOfProject(
                    projectTeamId,
                    userId,
                );
            if (!isMember) {
                this.logger.warn(
                    `사용자(ID: ${userId})는 프로젝트(ID: ${projectTeamId})에 속하지 않습니다.`,
                );
                throw new Error('사용자가 프로젝트 멤버가 아닙니다.');
            }
            this.logger.debug(
                `✅ [SUCCESS] 유저 확인 성공 (ID: ${projectTeamId}), User (ID: ${userId})`,
            );
        } catch (error) {
            this.logger.error(
                `❌ [ERROR] 유저 확인 실패 (ID: ${projectTeamId}), User (ID: ${userId})`,
                error,
            );
            throw new Error('프로젝트 멤버 여부 확인 중 오류가 발생했습니다.');
        }
    }

    async createProject(
        createProjectTeamRequest: CreateProjectTeamRequest,
    ): Promise<any> {
        try {
            this.logger.debug('🔥 [START] Create project service 호출');

            const isDuplicate =
                await this.projectTeamRepository.findProjectByName(
                    createProjectTeamRequest.name,
                );

            if (isDuplicate) {
                throw new Error('이미 존재하는 프로젝트 이름입니다.');
            }

            this.logger.debug(
                '🔍 createProjectTeamRequest 확인: ',
                createProjectTeamRequest,
            );

            const createdProject =
                await this.projectTeamRepository.createProject(
                    createProjectTeamRequest,
                );

            this.logger.debug('✅ 프로젝트 생성 성공');
            return createdProject;
        } catch (error) {
            this.logger.error('❌ [ERROR] 프로젝트 생성 중 예외 발생: ', error);

            if (error instanceof TypeError) {
                this.logger.error('TypeError 디버깅: ', error.stack);
            }
            throw error;
        }
    }

    async getProjectById(id: number): Promise<any> {
        try {
            this.logger.debug(`🔍 [INFO] ID(${id})로 프로젝트 조회 시작`);

            const project = await this.projectTeamRepository.getProjectById(id);

            if (!project) {
                throw new NotFoundProjectException();
            }

            this.logger.debug('✅ 프로젝트 조회 성공');
            return project;
        } catch (error) {
            this.logger.error('❌ [ERROR] 프로젝트 조회 중 예외 발생: ', error);
            throw error;
        }
    }

    async updateProjectTeam(
        id: number,
        userId: number,
        updateProjectTeamRequest: UpdateProjectTeamRequest,
        imageUrls: string[] = [],
        projectMembers: { userId: number; isLeader: boolean }[] = [],
        teamStacks: { id: number; stackId: number; isMain: boolean }[] = [],
    ): Promise<any> {
        try {
            this.logger.debug(`🔥 [START] ID(${id})로 프로젝트 업데이트 시작`);

            await this.ensureUserIsProjectMember(id, userId);

            const updatedProject =
                await this.projectTeamRepository.updateProjectTeam(
                    id,
                    updateProjectTeamRequest,
                    imageUrls,
                    projectMembers,
                    teamStacks,
                );

            this.logger.debug('✅ 프로젝트 업데이트 성공');
            return updatedProject;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] 프로젝트 업데이트 중 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    async closeProject(id: number, userId: number): Promise<any> {
        try {
            this.logger.debug(`🔥 [START] ID(${id})로 프로젝트 모집 마감 시작`);

            await this.ensureUserIsProjectMember(id, userId);

            const closedProject =
                await this.projectTeamRepository.closeProject(id);

            this.logger.debug('✅ 프로젝트 모집 마감 성공');
            return closedProject;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] 프로젝트 모집 마감 중 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    async deleteProject(id: number, userId: number): Promise<any> {
        try {
            this.logger.debug(`🔥 [START] ID(${id})로 프로젝트 삭제 시작`);

            await this.ensureUserIsProjectMember(id, userId);

            const deletedProject =
                await this.projectTeamRepository.deleteProject(id);

            this.logger.debug('✅ 프로젝트 삭제 성공');
            return deletedProject;
        } catch (error) {
            this.logger.error('❌ [ERROR] 프로젝트 삭제 중 예외 발생: ', error);
            throw error;
        }
    }
}
