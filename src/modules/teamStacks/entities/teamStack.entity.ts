import { Team } from '../../teams/entities/team.entity';
import { Stack } from './stack.entity';

export class TeamStackEntity {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    stackId: number;
    teamId: number;
    stack: Stack;
    team: Team;
}
