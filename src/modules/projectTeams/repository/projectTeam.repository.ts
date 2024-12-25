import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectTeamRequest } from '../dto/request/create.projectTeam.request';
import { UpdateProjectTeamRequest } from '../dto/request/update.projectTeam.request';
import {
    NotFoundProjectException,
    UploadProjectException,
    CloseProjectException,
    DeleteProjectException,
    DuplicateProjectNameException,
} from '../../../global/exception/custom.exception';
import { StatusCategory } from '@prisma/client';

@Injectable()
export class ProjectTeamRepository {
    private readonly logger = new Logger(ProjectTeamRepository.name);

    constructor(private readonly prisma: PrismaService) {}

    async findProjectByName(name: string): Promise<boolean> {
        try {
            this.logger.debug(`🔍 [INFO] 프로젝트 이름 중복 확인 중: ${name}`);
            const existingProject = await this.prisma.projectTeam.findUnique({
                where: { name },
            });
            return !!existingProject;
        } catch (error) {
            this.logger.error(
                `❌ [ERROR] checkIfProjectNameExists 중 예외 발생: ${name}`,
                error,
            );
            throw new DuplicateProjectNameException();
        }
    }

    async isUserMemberOfProject(
        projectTeamId: number,
        userId: number,
    ): Promise<boolean> {
        try {
            const exists = await this.prisma.projectMember.findFirst({
                where: {
                    projectTeamId: projectTeamId,
                    userId: userId,
                    isDeleted: false,
                },
                select: { id: true },
            });
            this.logger.debug(
                `🔍 [INFO] isUserMemberOfProject: Project (ID: ${projectTeamId}), User (ID: ${userId}) → Result: ${exists !== null}`,
            );
            return exists !== null;
        } catch (error) {
            this.logger.error(
                `❌ [ERROR] isUserMemberOfProject failed for Project (ID: ${projectTeamId}), User (ID: ${userId})`,
                error,
            );
            throw error;
        }
    }

    async createProject(
        createProjectTeamRequest: CreateProjectTeamRequest,
    ): Promise<any> {
        try {
            this.logger.debug('🔥 [START] createProjectTeam 요청 시작');

            // DTO에서 추출된 데이터
            const {
                projectMember,
                resultImages,
                frontendNum, // 필수 필드 추가
                backendNum,
                devopsNum,
                uiuxNum,
                dataEngineerNum,
                ...projectData
            } = createProjectTeamRequest;

            // 기본값 설정
            const validProjectMember = Array.isArray(projectMember)
                ? projectMember
                : [];
            const validResultImages = Array.isArray(resultImages)
                ? resultImages
                : [];

            // 데이터베이스 요청
            const projectTeam = await this.prisma.projectTeam.create({
                data: {
                    ...projectData,
                    frontendNum,
                    backendNum,
                    devopsNum,
                    uiuxNum,
                    dataEngineerNum, // 추가
                    githubLink: projectData.githubLink || '',
                    notionLink: projectData.notionLink || '',
                    recruitExplain:
                        projectData.recruitExplain || '프로젝트 모집 설명',
                    projectMember: {
                        create: validProjectMember.map((member) => ({
                            user: { connect: { id: member.userId } },
                            isLeader: member.isLeader,
                            teamRole: member.teamRole, // 필수 필드 기본값 추가
                            summary: '초기 참여 인원입니다',
                            status: 'APPROVED' as StatusCategory, // 필수 필드 추가
                        })),
                    },
                    resultImages: {
                        create: validResultImages.map((imageUrl) => ({
                            imageUrl,
                        })),
                    },
                },
                include: {
                    projectMember: true,
                    resultImages: true,
                },
            });

            this.logger.debug('✅ Project created successfully');
            return projectTeam;
        } catch (error) {
            this.logger.error('❌ Error while creating project', error);
            throw new UploadProjectException();
        }
    }

    async closeProject(id: number): Promise<any> {
        try {
            const closedProject = await this.prisma.projectTeam.update({
                where: { id },
                data: { isRecruited: false },
            });

            this.logger.debug('✅ Project closed successfully');
            return closedProject;
        } catch (error) {
            this.logger.error('❌ Error while closing project', error);
            throw new CloseProjectException();
        }
    }

    async deleteProject(id: number): Promise<any> {
        try {
            const deletedProject = await this.prisma.projectTeam.update({
                where: { id },
                data: { isDeleted: true },
            });

            this.logger.debug('✅ Project deleted successfully');
            return deletedProject;
        } catch (error) {
            this.logger.error('❌ Error while deleting project', error);
            throw new DeleteProjectException();
        }
    }

    async getProjectById(id: number): Promise<any> {
        try {
            const project = await this.prisma.projectTeam.findUnique({
                where: {
                    id,
                    isDeleted: false,
                },
                include: {
                    resultImages: { where: { isDeleted: false } },
                    projectMember: { where: { isDeleted: false } },
                },
            });

            if (!project) {
                throw new NotFoundProjectException();
            }

            this.logger.debug('✅ Project retrieved successfully');
            return project;
        } catch (error) {
            this.logger.error('❌ Error while retrieving project', error);
            throw new NotFoundProjectException();
        }
    }

    async updateProjectTeam(
        id: number,
        updateData: Partial<UpdateProjectTeamRequest>,
        imageUrls: string[] = [],
        projectMembers: {
            userId: number;
            isLeader: boolean;
            teamRole?: string;
            summary?: string;
        }[] = [],
        teamStacks: { id: number; stackId: number; isMain: boolean }[] = [],
    ): Promise<any> {
        try {
            this.logger.debug(
                `🔥 [START] updateProjectTeam 요청 시작: Project ID: ${id}`,
            );

            // 프로젝트 멤버 처리
            this.logger.debug('🔍 [INFO] 프로젝트 멤버 처리 시작');
            const userIds =
                Array.isArray(projectMembers) && projectMembers.length > 0
                    ? projectMembers.map((member) => member.userId)
                    : [];

            const existingProjectMembers =
                await this.prisma.projectMember.findMany({
                    where: {
                        projectTeamId: id,
                        userId: { in: userIds },
                    },
                    select: {
                        id: true,
                        userId: true,
                    },
                });

            this.logger.debug(
                `🔍 [INFO] 기존 프로젝트 멤버 조회 완료: ${JSON.stringify(existingProjectMembers)}`,
            );

            const projectMemberIdMap = existingProjectMembers.reduce(
                (acc, member) => {
                    acc[member.userId] = member.id;
                    return acc;
                },
                {},
            );

            const upsertMembers =
                Array.isArray(projectMembers) && projectMembers.length > 0
                    ? projectMembers.map((member) => {
                          const existingId = projectMemberIdMap[member.userId];
                          return {
                              where: { id: existingId || 0 },
                              create: {
                                  user: { connect: { id: member.userId } },
                                  isLeader: member.isLeader,
                                  teamRole: member.teamRole || 'Default Role',
                                  summary: member.summary || 'Default Summary',
                                  status: 'APPROVED' as StatusCategory,
                              },
                              update: {
                                  isLeader: member.isLeader,
                                  teamRole: member.teamRole || 'Default Role',
                                  summary: member.summary || 'Default Summary',
                                  status: 'APPROVED' as StatusCategory,
                              },
                          };
                      })
                    : [];

            this.logger.debug(
                `🔍 [INFO] upsertMembers 데이터 생성 완료: ${JSON.stringify(upsertMembers)}`,
            );

            // 팀 스택 처리
            this.logger.debug('🔍 [INFO] 팀 스택 처리 시작');
            const stackIds =
                Array.isArray(teamStacks) && teamStacks.length > 0
                    ? teamStacks.map((stack) => stack.id)
                    : [];

            const existingTeamStacks = await this.prisma.teamStack.findMany({
                where: {
                    projectTeamId: id,
                    id: { in: stackIds },
                },
                select: {
                    id: true,
                },
            });

            this.logger.debug(
                `🔍 [INFO] 기존 팀 스택 조회 완료: ${JSON.stringify(existingTeamStacks)}`,
            );

            const teamStackIdMap = existingTeamStacks.reduce((acc, stack) => {
                acc[stack.id] = stack.id;
                return acc;
            }, {});

            const upsertStacks =
                Array.isArray(teamStacks) && teamStacks.length > 0
                    ? teamStacks.map((stack) => {
                          const existingId = teamStackIdMap[stack.id];
                          return {
                              where: { id: existingId || 0 },
                              create: {
                                  stack: { connect: { id: stack.stackId } },
                                  isMain: stack.isMain,
                              },
                              update: {
                                  isMain: stack.isMain,
                              },
                          };
                      })
                    : [];

            this.logger.debug(
                `🔍 [INFO] upsertStacks 데이터 생성 완료: ${JSON.stringify(upsertStacks)}`,
            );

            // 프로젝트 팀 데이터 업데이트
            this.logger.debug('🔄 [INFO] 프로젝트 팀 데이터 업데이트 시작');
            const projectTeamUpdateData = {
                ...updateData,
                notionLink: updateData.notionLink || '', // 필수 필드 기본값 추가
            };

            const updatedProjectTeam = await this.prisma.projectTeam.update({
                where: { id },
                data: {
                    ...projectTeamUpdateData,
                    resultImages:
                        imageUrls.length > 0
                            ? {
                                  create: imageUrls.map((url) => ({
                                      imageUrl: url,
                                  })),
                              }
                            : undefined,
                    projectMember:
                        upsertMembers.length > 0
                            ? { upsert: upsertMembers }
                            : undefined,
                    teamStacks:
                        upsertStacks.length > 0
                            ? { upsert: upsertStacks }
                            : undefined,
                },
                include: {
                    resultImages: true,
                    projectMember: true,
                    teamStacks: true,
                },
            });

            this.logger.debug('✅ [SUCCESS] 프로젝트 팀 데이터 업데이트 성공');
            this.logger.debug(
                `📘 [RESULT] 업데이트된 데이터: ${JSON.stringify(updatedProjectTeam)}`,
            );
            return updatedProjectTeam;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] updateProjectTeam 에서 예외 발생: ',
                error,
            );
            throw new Error('데이터베이스 에러가 발생했습니다.');
        }
    }
}
