import { TeamEntity } from '../../entities/team.entity';
import { TeamMemberEntity } from '../../../teamMembers/entities/teamMember.entity';
import { TeamStackEntity } from '../../../teamStacks/entities/teamStack.entity';

export class GetTeamResponse {
    readonly id: number;
    readonly name: string;
    readonly category: string;
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
    readonly teamMembers: TeamMemberEntity[];

    constructor(teamEntity: TeamEntity) {
        this.id = teamEntity.id;
        this.name = teamEntity.name;
        this.category = teamEntity.category;
        this.isRecruited = teamEntity.isRecruited;
        this.isFinished = teamEntity.isFinished;
        this.createdAt = teamEntity.createdAt;
        this.updatedAt = teamEntity.updatedAt;
        this.isDeleted = teamEntity.isDeleted;
        this.stacks = teamEntity.stacks;
        this.teamStacks = teamEntity.teamStacks;
        this.teamMembers = teamEntity.teamMembers;
    }
}
