import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DuplicateProjectNameException } from '../../../global/exception/custom.exception';

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
