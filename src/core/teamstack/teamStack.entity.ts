import { ProjectTeamEntity } from '../projectTeams/entities/projectTeam.entity';
import { StackEntity } from '../stacks/entities/stack.entity';

export class TeamStackEntity {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    isMain: boolean; // 대표 기술 스택 여부

    projectTeamId: number;
    stackId: number;
    team: ProjectTeamEntity;
    stack: StackEntity;
}
