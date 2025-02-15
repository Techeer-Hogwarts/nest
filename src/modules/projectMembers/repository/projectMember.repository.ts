import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectMember, StatusCategory } from '@prisma/client';
import { CreateProjectMemberRequest } from '../dto/request/create.projectMember.request';

@Injectable()
export class ProjectMemberRepository {
    private readonly logger = new Logger(ProjectMemberRepository.name);

    constructor(private readonly prisma: PrismaService) {}

    async checkExistingMember(
        projectTeamId: number,
        userId: number,
    ): Promise<boolean> {
        const existingMember = await this.prisma.projectMember.findFirst({
            where: {
                projectTeamId,
                userId,
            },
        });
        return !!existingMember;
    }

    async isUserAlreadyInProject(
        projectTeamId: number,
        userId: number,
    ): Promise<boolean> {
        try {
            const existingMember = await this.prisma.projectMember.findFirst({
                where: {
                    projectTeamId: projectTeamId,
                    userId: userId,
                    isDeleted: false,
                },
            });

            const isMember = !!existingMember;
            if (isMember) {
                this.logger.warn(
                    `User (ID: ${userId}) is already a member of Project Team (ID: ${projectTeamId})`,
                );
            }

            return isMember;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] isUserAlreadyInProject 에서 예외 발생: ',
                error,
            );
            throw new Error(
                '사용자가 프로젝트에 가입되어 있는지 확인 중 오류가 발생했습니다.',
            );
        }
    }

    async applyToProject(
        createProjectMemberRequest: CreateProjectMemberRequest,
        userId: number,
    ): Promise<any> {
        try {
            const newApplication = await this.prisma.projectMember.create({
                data: {
                    projectTeamId: createProjectMemberRequest.projectTeamId,
                    userId: userId,
                    status: 'PENDING',
                    summary: createProjectMemberRequest.summary,
                    teamRole: createProjectMemberRequest.teamRole,
                    isLeader: false,
                },
            });
            this.logger.debug('✅ [SUCCESS] 프로젝트 지원 성공');
            return newApplication;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] applyToProject 에서 예외 발생: ',
                error,
            );
            throw new Error('프로젝트 지원 중 오류가 발생했습니다.');
        }
    }

    async cancelApplication(
        projectTeamId: number,
        userId: number,
    ): Promise<any> {
        try {
            const existingData = await this.prisma.projectMember.findFirst({
                where: {
                    projectTeamId: projectTeamId,
                    userId: userId,
                },
            });

            if (!existingData) {
                throw new Error('존재하지 않는 프로젝트 신청입니다.');
            }

            const updatedData = await this.prisma.projectMember.update({
                where: {
                    id: existingData.id,
                },
                data: {
                    isDeleted: true,
                },
            });

            this.logger.debug('✅ [INFO] update 실행 결과:', updatedData);

            return updatedData;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] cancelApplication 에서 예외 발생: ',
                error,
            );
            throw new Error('프로젝트 지원 취소 중 오류가 발생했습니다.');
        }
    }

    async getApplicants(projectTeamId: number): Promise<any> {
        try {
            const applicants = await this.prisma.projectMember.findMany({
                where: {
                    projectTeamId: projectTeamId,
                    status: 'PENDING',
                    isDeleted: false,
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            mainPosition: true,
                            profileImage: true,
                        },
                    },
                },
            });
            return applicants;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getApplicants 에서 예외 발생: ',
                error,
            );
            throw new Error('프로젝트 지원자 조회 중 오류가 발생했습니다.');
        }
    }

    async updateApplicantStatus(
        projectTeamId: number,
        userId: number,
        status: StatusCategory,
    ): Promise<
        ProjectMember & { user: { name: string; profileImage: string } }
    > {
        try {
            const member = await this.prisma.projectMember.findFirst({
                where: {
                    projectTeamId,
                    userId,
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            profileImage: true,
                        },
                    },
                },
            });

            if (!member) {
                throw new Error('해당 멤버를 찾을 수 없습니다.');
            }

            return await this.prisma.projectMember.update({
                where: { id: member.id },
                data: { status },
                include: {
                    user: {
                        select: {
                            name: true,
                            profileImage: true,
                        },
                    },
                },
            });
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] updateApplicantStatus 에서 예외 발생: ',
                error,
            );
            throw new Error(
                '프로젝트 지원자 상태 업데이트 중 오류가 발생했습니다.',
            );
        }
    }

    async addMemberToProjectTeam(
        projectTeamId: number,
        memberId: number,
        isLeader: boolean,
        teamRole: string,
    ): Promise<any> {
        try {
            // 프로젝트 팀원 추가
            const newMember = await this.prisma.projectMember.create({
                data: {
                    projectTeamId: projectTeamId, // projectTeamId 연결
                    userId: memberId, // userId 연결
                    isLeader: isLeader,
                    teamRole: teamRole,
                    summary: '프로젝트 팀에 추가된 멤버',
                    status: 'APPROVED', // 승인 상태로 추가
                },
            });

            this.logger.debug('✅ [SUCCESS] 프로젝트 팀원 추가 성공');
            return newMember;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] addMemberToProjectTeam 에서 예외 발생: ',
                error,
            );
            throw new Error('프로젝트 팀원 추가 중 오류가 발생했습니다.');
        }
    }

    async isUserMemberOfProject(
        projectTeamId: number,
        userId: number,
    ): Promise<boolean> {
        try {
            const count = await this.prisma.projectMember.count({
                where: {
                    projectTeamId: projectTeamId,
                    userId: userId,
                    isDeleted: false,
                },
            });
            return count > 0;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] isUserMemberOfProject 에서 예외 발생: ',
                error,
            );
            throw new Error('프로젝트 팀 멤버 확인 중 오류가 발생했습니다.');
        }
    }

    async getApplicantStatus(
        projectTeamId: number,
        userId: number,
    ): Promise<string | null> {
        try {
            const member = await this.prisma.projectMember.findFirst({
                where: {
                    projectTeamId,
                    userId,
                    isDeleted: false,
                },
                select: { status: true },
            });
            return member ? member.status : null;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getApplicantStatus 에서 예외 발생: ',
                error,
            );
            throw new Error('지원자의 상태를 가져오는 중 오류가 발생했습니다.');
        }
    }
}
