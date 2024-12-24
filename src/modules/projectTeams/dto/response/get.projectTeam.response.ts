import { ProjectTeamEntity } from '../../entities/projectTeam.entity';
import { ProjectMemberEntity } from '../../../projectMembers/entities/projectMember.entity';
import { TeamStackEntity } from '../../../teamStacks/entities/teamStack.entity';

export class GetProjectTeamResponse {
    readonly id: number;
    readonly name: string;
    readonly githubLink: string;
    readonly notionLink: string;
    readonly projectExplain: string;
    readonly frontendNum: number;
    readonly backendNum: number;
    readonly devopsNum: number;
    readonly uiuxNum: number;
    readonly dataEngineerNum: number;
    readonly recruitExplain: string;
    readonly isRecruited: boolean;
    readonly isFinished: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly isDeleted: boolean;
    readonly stacks: {
        id: number;
        name: string;
        category: string;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
    }[];
    readonly teamStacks: TeamStackEntity[];
    readonly projectMembers: ProjectMemberEntity[];

    constructor(teamEntity: ProjectTeamEntity) {
        this.id = teamEntity.id;
        this.name = teamEntity.name;
        this.githubLink = teamEntity.githubLink;
        this.notionLink = teamEntity.notionLink;
        this.projectExplain = teamEntity.projectExplain;
        this.frontendNum = teamEntity.frontendNum;
        this.backendNum = teamEntity.backendNum;
        this.devopsNum = teamEntity.devopsNum;
        this.uiuxNum = teamEntity.uiuxNum;
        this.dataEngineerNum = teamEntity.dataEngineerNum;
        this.recruitExplain = teamEntity.recruitExplain;
        this.isRecruited = teamEntity.isRecruited;
        this.isFinished = teamEntity.isFinished;
        this.createdAt = teamEntity.createdAt;
        this.updatedAt = teamEntity.updatedAt;
        this.isDeleted = teamEntity.isDeleted;
        this.stacks = teamEntity.stacks;
        this.teamStacks = teamEntity.teamStacks;
        this.projectMembers = teamEntity.projectMembers;
    }
}
