import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';
import { GetTeamQueryRequest } from '../dto/request/get.team.query.request';
import {
    FormattedProject,
    FormattedStudy,
} from '../dto/response/get.allTeams.response';
import { Prisma } from '@prisma/client';
import { DuplicateProjectNameException } from '../../../global/exception/custom.exception';

type TeamQueryResult = {
    id: number;
    created_at: Date;
    is_deleted: boolean;
    is_recruited: boolean;
    is_finished: boolean;
    name: string;
    team_type: 'project' | 'study';
    description: string;
    frontend_num?: number;
    backend_num?: number;
    devops_num?: number;
    full_stack_num?: number;
    data_engineer_num?: number;
    recruit_num?: number;
};

@Injectable()
export class ProjectTeamRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    async getAllTeams(request: GetTeamQueryRequest): Promise<{
        teams: (FormattedProject | FormattedStudy)[];
        total: number;
    }> {
        const {
            isRecruited,
            isFinished,
            offset = 0,
            limit = 10,
        }: GetTeamQueryRequest = request;

        const recruitedFilter =
            isRecruited !== undefined
                ? `AND is_recruited = ${isRecruited}`
                : '';
        const finishedFilter =
            isFinished !== undefined ? `AND is_finished = ${isFinished}` : '';

        // 프로젝트와 스터디를 하나의 쿼리에서 조회
        const query = `
        SELECT id, created_at, is_deleted, is_recruited, is_finished, name, 
            'project' AS team_type,
            project_explain AS description,
            frontend_num, backend_num, devops_num, full_stack_num, data_engineer_num,
            NULL AS recruit_num
        FROM project_team
        WHERE is_deleted = false ${recruitedFilter} ${finishedFilter}
        
        UNION ALL
        
        SELECT id, created_at, is_deleted, is_recruited, is_finished, name, 
            'study' AS team_type,
            study_explain AS description,
            NULL AS frontend_num, NULL AS backend_num, NULL AS devops_num, NULL AS full_stack_num, NULL AS data_engineer_num,
            recruit_num
        FROM study_team
        WHERE is_deleted = false ${recruitedFilter} ${finishedFilter}
        
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset};
    `;

        const totalQuery = `
            SELECT COUNT(*) AS total FROM (
                SELECT id FROM project_team WHERE is_deleted = false ${recruitedFilter} ${finishedFilter}
                UNION ALL
                SELECT id FROM study_team WHERE is_deleted = false ${recruitedFilter} ${finishedFilter}
            ) AS total_teams;
        `;

        const teamsResult =
            await this.prisma.$queryRawUnsafe<TeamQueryResult[]>(query);
        const totalResult = await this.prisma.$queryRawUnsafe(totalQuery);
        const total = totalResult[0]?.total ?? 0;

        const formattedTeams: (FormattedProject | FormattedStudy)[] =
            teamsResult.map((team): FormattedProject | FormattedStudy => {
                if (team.team_type === 'project') {
                    return new FormattedProject(team);
                } else {
                    return new FormattedStudy(team);
                }
            });

        return {
            teams: formattedTeams,
            total,
        };
    }

    async getProjectTeamList(request: GetTeamQueryRequest): Promise<{
        teams: FormattedProject[];
        total: number;
    }> {
        const {
            isRecruited,
            isFinished,
            positions,
            offset = 0,
            limit = 10,
        }: GetTeamQueryRequest = request;

        const getPositionFilter = (
            positions?: string[],
        ): Prisma.ProjectTeamWhereInput => {
            if (!positions || positions.length === 0) return {};

            const filters = positions
                .map((position) => {
                    switch (position) {
                        case 'frontend':
                            return { frontendNum: { gt: 0 } };
                        case 'backend':
                            return { backendNum: { gt: 0 } };
                        case 'devops':
                            return { devopsNum: { gt: 0 } };
                        case 'fullstack':
                            return { fullStackNum: { gt: 0 } };
                        case 'dataEngineer':
                            return { dataEngineerNum: { gt: 0 } };
                        default:
                            return null;
                    }
                })
                .filter(Boolean);

            return filters.length > 0 ? { OR: filters } : {};
        };

        const projectTeams = await this.prisma.projectTeam.findMany({
            where: {
                isDeleted: false,
                ...(isRecruited !== undefined ? { isRecruited } : {}),
                ...(isFinished !== undefined ? { isFinished } : {}),
                ...(positions && getPositionFilter(positions)),
            },
            select: {
                id: true,
                isDeleted: true,
                isRecruited: true,
                isFinished: true,
                name: true,
                createdAt: true,
                frontendNum: true,
                backendNum: true,
                devopsNum: true,
                fullStackNum: true,
                dataEngineerNum: true,
                projectExplain: true,
                mainImages: {
                    where: { isDeleted: false },
                    select: { imageUrl: true },
                },
                teamStacks: {
                    where: { isMain: true },
                    include: { stack: true },
                },
            },
            skip: offset,
            take: limit,
        });
        const total = await this.prisma.projectTeam.count({
            where: {
                isDeleted: false,
                ...(isRecruited !== undefined ? { isRecruited } : {}),
                ...(isFinished !== undefined ? { isFinished } : {}),
                ...(positions && getPositionFilter(positions)),
            },
        });
        const formattedProjects = projectTeams.map(
            (project) => new FormattedProject(project),
        );
        return {
            teams: formattedProjects,
            total,
        };
    }

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
