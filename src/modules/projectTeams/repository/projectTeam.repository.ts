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
        try {
            const {
                isRecruited,
                isFinished,
                positions,
                offset = 0,
                limit = 10,
            }: GetTeamQueryRequest = request;
            this.logger.debug('모든 팀 조회 시작', 'getAllTeams');

            // 프로젝트 조회
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
            });
            const formattedProjects = projectTeams.map(
                (project) => new FormattedProject(project),
            );

            // 스터디 조회
            const studyTeams = await this.prisma.studyTeam.findMany({
                where: {
                    isDeleted: false,
                    ...(isRecruited !== undefined ? { isRecruited } : {}),
                    ...(isFinished !== undefined ? { isFinished } : {}),
                },
                select: {
                    id: true,
                    isDeleted: true,
                    isRecruited: true,
                    isFinished: true,
                    name: true,
                    createdAt: true,
                    recruitNum: true,
                    studyExplain: true,
                },
            });
            const formattedStudies = studyTeams.map(
                (study) => new FormattedStudy(study),
            );

            // 프로젝트와 스터디 데이터를 병합 후 정렬
            const combinedList = [
                ...formattedProjects,
                ...formattedStudies,
            ].sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
            );

            // 페이징 처리
            const paginatedList = combinedList.slice(offset, offset + limit);
            const total = combinedList.length; // 전체 개수 계산

            return {
                teams: paginatedList,
                total,
            };
        } catch (error) {
            this.logger.error(
                `getAllTeams 에서 예외 발생: ${error}`,
                ProjectTeamRepository.name,
            );
            throw error;
        }
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
        this.logger.debug('모든 프로젝트 조회 시작', 'getProjectTeamList');

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

    async getStudyTeamList(request: GetTeamQueryRequest): Promise<{
        teams: FormattedStudy[];
        total: number;
    }> {
        const {
            isRecruited,
            isFinished,
            offset = 0,
            limit = 10,
        }: GetTeamQueryRequest = request;
        this.logger.debug('모든 스터디 조회 시작', 'getStudyTeamList');

        const studyTeams = await this.prisma.studyTeam.findMany({
            where: {
                isDeleted: false,
                ...(isRecruited !== undefined ? { isRecruited } : {}),
                ...(isFinished !== undefined ? { isFinished } : {}),
            },
            select: {
                id: true,
                isDeleted: true,
                isRecruited: true,
                isFinished: true,
                name: true,
                createdAt: true,
                recruitNum: true,
                studyExplain: true,
            },
            skip: offset,
            take: limit,
        });
        const total = await this.prisma.studyTeam.count({
            where: {
                isDeleted: false,
                ...(isRecruited !== undefined ? { isRecruited } : {}),
                ...(isFinished !== undefined ? { isFinished } : {}),
            },
        });
        const formattedStudies = studyTeams.map(
            (study) => new FormattedStudy(study),
        );
        return {
            teams: formattedStudies,
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
