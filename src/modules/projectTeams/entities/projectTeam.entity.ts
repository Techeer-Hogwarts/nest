import { ProjectMemberEntity } from '../../projectMembers/entities/projectMember.entity';
import { TeamStackEntity } from '../../teamStacks/entities/teamStack.entity';
import { ProjectTeam } from '@prisma/client';

export class ProjectTeamEntity implements ProjectTeam {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    isRecruited: boolean;
    isFinished: boolean;
    name: string;
    githubLink: string;
    notionLink: string;
    projectExplain: string;
    frontendNum: number;
    backendNum: number;
    devopsNum: number;
    uiuxNum: number;
    dataEngineerNum: number;
    recruitExplain: string;

    teamStacks: TeamStackEntity[];
    projectMembers: ProjectMemberEntity[];

    stacks?: {
        id: number;
        name: string;
        category: string;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
    }[];

    constructor(partial: Partial<ProjectTeamEntity>) {
        Object.assign(this, partial);
    }
}
