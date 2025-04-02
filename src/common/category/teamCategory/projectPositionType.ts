import { TeamRole, TeamRoleType } from './teamRole.category';

export const PositionType = {
    FRONTEND: 'frontend',
    BACKEND: 'backend',
    DEVOPS: 'devops',
    FULLSTACK: 'fullstack',
    DATA_ENGINEER: 'dataEngineer',
} as const;

export type PositionType = (typeof PositionType)[keyof typeof PositionType];

export const positionValues: readonly PositionType[] =
    Object.values(PositionType);

export function isPosition(value: string): value is PositionType {
    return positionValues.includes(value as PositionType);
}

export const mapToTeamRoleNum: Record<TeamRoleType, keyof PositionNumType> = {
    [TeamRole.BACKEND]: 'backendNum',
    [TeamRole.FRONTEND]: 'frontendNum',
    [TeamRole.FULL_STACK]: 'fullStackNum',
    [TeamRole.DEV_OPS]: 'devopsNum',
    [TeamRole.DATA_ENGINEER]: 'dataEngineerNum',
};

type PositionNumType = {
    frontendNum: number;
    backendNum: number;
    devopsNum: number;
    fullStackNum: number;
    dataEngineerNum: number;
};
