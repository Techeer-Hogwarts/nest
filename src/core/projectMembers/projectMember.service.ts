import { Injectable } from '@nestjs/common';

import { Prisma, StatusCategory } from '@prisma/client';

import { MemberStatus } from '../../common/category/teamCategory/member.category';
import { TeamRoleType } from '../../common/category/teamCategory/teamRole.category';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { ProjectMemberResponse } from '../../common/dto/projectMembers/response/get.projectMembers.response';

import {
    ProjectMemberAlreadyActiveException,
    ProjectMemberApplicationExistsException,
    ProjectMemberInvalidActiveRequesterException,
    ProjectMemberNotFoundException,
} from './exception/projectMember.exception';

import { PrismaService } from '../../infra/prisma/prisma.service';
import {
    AcceptedApplicant,
    CancelledApplicant,
    ExistingProjectMember,
    PendingApplicant,
    ProjectLeaderEmails,
    RejectedApplicant,
    UpsertedApplicant,
} from '../../common/dto/projectMembers/response/project.member.response.interface';

@Injectable()
export class ProjectMemberService {
    constructor(
        private readonly logger: CustomWinstonLogger,
        private readonly prisma: PrismaService,
    ) {}

    async isProjectMember(
        projectTeamId: number,
        userId: number,
    ): Promise<void> {
        const member = await this.prisma.projectMember.findFirst({
            where: {
                projectTeamId: projectTeamId,
                userId: userId,
                isDeleted: false,
                status: MemberStatus.APPROVED,
            },
        });
        if (!member) {
            throw new ProjectMemberInvalidActiveRequesterException();
        }
    }

    async findManyProjectLeaders(
        projectTeamId: number,
    ): Promise<ProjectLeaderEmails[]> {
        const teamLeaders = await this.prisma.projectMember.findMany({
            where: {
                projectTeamId: projectTeamId,
                isLeader: true,
                isDeleted: false,
                status: MemberStatus.APPROVED,
            },
            select: {
                user: {
                    select: {
                        email: true,
                    },
                },
            },
        });
        if (teamLeaders.length === 0) {
            this.logger.error('프로젝트 지원에서 팀 리더를 찾을 수 없습니다.');
        }
        return teamLeaders;
    }

    async findAllProjectMembers(
        projectTeamId: number,
    ): Promise<ExistingProjectMember[]> {
        return await this.prisma.projectMember.findMany({
            where: {
                projectTeamId: projectTeamId,
            },
            select: {
                id: true,
                teamRole: true,
                isLeader: true,
                isDeleted: true,
                status: true,
                user: {
                    select: {
                        id: true,
                    },
                },
            },
        });
    }

    async updateDeletedProjectMembers(
        projectMemberIds: number[],
        tx: Prisma.TransactionClient,
    ): Promise<void> {
        await tx.projectMember.updateMany({
            where: { id: { in: projectMemberIds } },
            data: {
                isDeleted: true,
            },
        });
    }

    async findManyProjectMembers(
        projectTeamId: number,
    ): Promise<ProjectMemberResponse[]> {
        const projectMembers = await this.prisma.projectMember.findMany({
            where: {
                projectTeamId,
                status: MemberStatus.APPROVED,
                isDeleted: false,
            },
            include: { user: true },
        });

        return projectMembers.map(
            (member) => new ProjectMemberResponse(member),
        );
    }

    async upsertAppliedApplicant(
        projectTeamId: number,
        applicantId: number,
        teamRole: TeamRoleType,
        summary: string,
    ): Promise<UpsertedApplicant> {
        return await this.prisma.$transaction(async (tx) => {
            // 기존 신청 내역 확인
            const applicant = await tx.projectMember.findUnique({
                where: {
                    projectTeamId_userId_unique: {
                        projectTeamId: projectTeamId,
                        userId: applicantId,
                    },
                },
                select: {
                    id: true,
                    status: true,
                    isDeleted: true,
                },
            });
            // 이미 승인된 신청(또는 멤버인 경우)는 재신청을 막음
            if (applicant?.status === MemberStatus.PENDING) {
                throw new ProjectMemberApplicationExistsException();
            }
            if (
                applicant?.status === MemberStatus.APPROVED &&
                !applicant?.isDeleted
            ) {
                throw new ProjectMemberAlreadyActiveException();
            }

            // upsert를 사용해 기존 내역이 있으면 업데이트, 없으면 생성
            return await tx.projectMember.upsert({
                where: {
                    projectTeamId_userId_unique: {
                        projectTeamId: projectTeamId,
                        userId: applicantId,
                    },
                },
                update: {
                    teamRole: teamRole,
                    summary: summary,
                    status: MemberStatus.PENDING,
                    isDeleted: false,
                },
                create: {
                    user: { connect: { id: applicantId } },
                    projectTeam: {
                        connect: {
                            id: projectTeamId,
                        },
                    },
                    teamRole: teamRole,
                    summary: summary,
                    status: MemberStatus.PENDING,
                    isLeader: false,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true,
                            email: true,
                            year: true,
                        },
                    },
                },
            });
        });
    }

    async updateCancelledApplicant(
        projectTeamId: number,
        userId: number,
    ): Promise<CancelledApplicant> {
        return await this.prisma.$transaction(async (tx) => {
            const applicant = await tx.projectMember.findUnique({
                where: {
                    projectTeamId_userId_unique: {
                        projectTeamId: projectTeamId,
                        userId: userId,
                    },
                    isDeleted: false,
                    status: MemberStatus.PENDING,
                },
                include: { user: true },
            });

            if (!applicant) {
                throw new ProjectMemberNotFoundException();
            }
            return await tx.projectMember.update({
                where: { id: applicant.id },
                data: { isDeleted: true },
                include: { user: true },
            });
        });
    }

    async findManyApplicants(
        projectTeamId: number,
    ): Promise<PendingApplicant[]> {
        return await this.prisma.projectMember.findMany({
            where: {
                projectTeamId,
                isDeleted: false,
                status: MemberStatus.PENDING,
            },
            include: { user: true },
        });
    }

    async findUniqueAcceptedApplicant(
        projectTeamId: number,
        applicantId: number,
    ): Promise<AcceptedApplicant> {
        const applicant = await this.prisma.projectMember.findUnique({
            where: {
                projectTeamId_userId_unique: {
                    projectTeamId: projectTeamId,
                    userId: applicantId,
                },
            },
            select: {
                id: true,
                status: true,
                teamRole: true,
                isDeleted: true,
            },
        });
        if (!applicant) {
            throw new ProjectMemberNotFoundException();
        }
        return applicant;
    }

    async findUniqueRejectedApplicant(
        projectTeamId: number,
        applicantId: number,
    ): Promise<{ id: number; status: StatusCategory }> {
        const applicant = await this.prisma.projectMember.findUnique({
            where: {
                projectTeamId_userId_unique: {
                    projectTeamId: projectTeamId,
                    userId: applicantId,
                },
                isDeleted: false,
            },
            select: {
                id: true,
                status: true,
            },
        });
        if (!applicant) {
            throw new ProjectMemberNotFoundException();
        }
        return applicant;
    }

    async updateRejectedApplicant(
        projectMemberId: number,
    ): Promise<RejectedApplicant> {
        return await this.prisma.projectMember.update({
            where: { id: projectMemberId },
            data: { status: MemberStatus.REJECT },
            select: {
                id: true,
                isLeader: true,
                teamRole: true,
                summary: true,
                status: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                        email: true,
                        year: true,
                    },
                },
            },
        });
    }

    async addProjectMember(
        projectTeamId: number,
        memberId: number,
        isLeader: boolean,
        teamRole: TeamRoleType,
    ): Promise<ProjectMemberResponse> {
        const newMember = await this.prisma.projectMember.create({
            data: {
                projectTeam: { connect: { id: projectTeamId } },
                user: { connect: { id: memberId } },
                isLeader,
                teamRole,
                status: MemberStatus.APPROVED,
                summary: '팀원으로 추가되었습니다',
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
        return new ProjectMemberResponse(newMember);
    }
}
