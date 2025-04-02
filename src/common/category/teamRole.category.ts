export const TeamRole = {
    BACKEND: 'Backend',
    FRONTEND: 'Frontend',
    DEV_OPS: 'DevOps',
    FULL_STACK: 'FullStack',
    DATA_ENGINEER: 'DataEngineer',
} as const;
export type TeamRoleType = (typeof TeamRole)[TeamRoleKey];
type TeamRoleKey = keyof typeof TeamRole;
const teamRoleValues: readonly TeamRoleType[] = Object.values(TeamRole);

export function isTeamRole(value: string): value is TeamRoleType {
    return teamRoleValues.includes(value as TeamRoleType);
}
export function setTeamRole(value: string): TeamRoleType {
    if (isTeamRole(value)) {
        return value;
    }
}

type PositionNumType = {
    frontendNum: number;
    backendNum: number;
    devopsNum: number;
    fullStackNum: number;
    dataEngineerNum: number;
};
export const mapToTeamRoleNum: Record<TeamRoleType, keyof PositionNumType> = {
    [TeamRole.BACKEND]: 'backendNum',
    [TeamRole.FRONTEND]: 'frontendNum',
    [TeamRole.FULL_STACK]: 'fullStackNum',
    [TeamRole.DEV_OPS]: 'devopsNum',
    [TeamRole.DATA_ENGINEER]: 'dataEngineerNum',
};
