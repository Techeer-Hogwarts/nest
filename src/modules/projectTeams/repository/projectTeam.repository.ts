import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProjectTeamRequest } from '../dto/request/update.projectTeam.request';
import {
    NotFoundProjectException,
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

    // async createProject(data: CreateProjectTeamRequest): Promise<any> {
    //     try {
    //         // 이름 기반으로 스택 ID 조회
    //         const validStacks = await this.prisma.stack.findMany({
    //             where: {
    //                 name: {
    //                     in: data.teamStacks?.map((stack) => stack.stack) || [],
    //                 },
    //             },
    //         });
    //
    //         if (validStacks.length !== (data.teamStacks?.length || 0)) {
    //             throw new Error('유효하지 않은 스택 이름이 포함되어 있습니다.');
    //         }
    //
    //         // teamStacks 데이터를 Prisma 형식으로 변환
    //         const teamStacksData = data.teamStacks?.map((stack) => {
    //             const matchedStack = validStacks.find(
    //                 (validStack) => validStack.name === stack.stack,
    //             );
    //             if (!matchedStack) {
    //                 throw new Error(`스택(${stack.stack})을 찾을 수 없습니다.`);
    //             }
    //             return {
    //                 stackId: matchedStack.id,
    //                 isMain: stack.isMain,
    //             };
    //         });
    //
    //         // 데이터 저장
    //         const createdProject = await this.prisma.projectTeam.create({
    //             data: {
    //                 ...data,
    //                 githubLink: data.githubLink || '', // 기본값 추가
    //                 notionLink: data.notionLink || '', // 기본값 추가
    //                 teamStacks: {
    //                     create: teamStacksData, // 변환된 teamStacks 데이터 전달
    //                 },
    //                 projectMember: {
    //                     create: data.projectMember.map((member) => ({
    //                         user: { connect: { id: member.userId } },
    //                         isLeader: member.isLeader,
    //                         teamRole: member.teamRole,
    //                         summary: '초기 참여 인원입니다',
    //                         status: 'APPROVED',
    //                     })),
    //                 },
    //                 resultImages: {
    //                     create: data.resultImages?.map((url) => ({
    //                         imageUrl: url,
    //                     })),
    //                 },
    //             },
    //             include: {
    //                 teamStacks: { include: { stack: true } },
    //                 projectMember: { include: { user: true } },
    //                 resultImages: true,
    //             },
    //         });
    //
    //         return createdProject;
    //     } catch (error) {
    //         throw new Error(
    //             `프로젝트 생성 중 오류가 발생했습니다: ${error.message}`,
    //         );
    //     }
    // }

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
        if (!id) {
            throw new Error('ID가 전달되지 않았습니다.');
        }

        try {
            this.logger.debug(`🔍 [INFO] ID(${id})로 프로젝트 조회 시작`);

            const project = await this.prisma.projectTeam.findUnique({
                where: {
                    id: id, // 유니크한 `id`가 전달되어야 함
                },
                include: {
                    resultImages: {
                        where: { isDeleted: false },
                    },
                    projectMember: {
                        where: { isDeleted: false },
                    },
                },
            });

            if (!project || project.isDeleted) {
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

    async getProjectTeamMembersById(id: number): Promise<any> {
        try {
            const projectTeam = await this.prisma.projectTeam.findUnique({
                where: {
                    id: id,
                    isDeleted: false,
                },
                select: {
                    name: true,
                    projectMember: {
                        where: {
                            isDeleted: false,
                            status: 'APPROVED', // 🔥 APPROVED 상태의 멤버만 조회
                        },
                        select: {
                            user: {
                                select: {
                                    name: true,
                                },
                            },
                            teamRole: true, // 역할 가져오기
                            isLeader: true, // 팀장 여부 가져오기
                        },
                    },
                },
            });

            if (!projectTeam) {
                return null;
            }

            const formattedProjectTeam = {
                projectName: projectTeam.name,
                members: projectTeam.projectMember.map((member) => ({
                    name: member.user.name,
                    role: member.teamRole,
                    isLeader: member.isLeader, // 팀장 여부 추가
                })),
            };

            this.logger.debug('✅ [SUCCESS] 프로젝트의 모든 인원 조회 성공');
            return formattedProjectTeam;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getProjectTeamMembersById 에서 예외 발생: ',
                error,
            );
            throw new Error('데이터베이스 에러가 발생했습니다.');
        }
    }

    async isUserExists(userId: number): Promise<boolean> {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            return !!user; // 사용자가 존재하면 true, 그렇지 않으면 false 반환
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] isUserExists 에서 예외 발생: ',
                error,
            );
            throw new Error('사용자 존재 여부 확인 중 오류가 발생했습니다.');
        }
    }
}
