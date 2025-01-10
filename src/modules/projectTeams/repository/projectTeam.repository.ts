import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CloseProjectException,
    DeleteProjectException,
    DuplicateProjectNameException,
} from '../../../global/exception/custom.exception';

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
