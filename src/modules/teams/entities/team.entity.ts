import { Team } from '@prisma/client';
import { TeamMemberEntity } from '../../teamMembers/domain/teamMember.entity';
import { TeamStackEntity } from '../../teamStacks/entities/teamStack.entity';

export class TeamEntity implements Team {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    isRecruited: boolean;
    isFinished: boolean;
    name: string;
    category: string;

    teamStacks: TeamStackEntity[];
    teamMembers: TeamMemberEntity[];

    stacks?: {
        id: number;
        name: string;
        category: string;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
    }[];

    constructor(partial: Partial<TeamEntity>) {
        Object.assign(this, partial);
    }
}
