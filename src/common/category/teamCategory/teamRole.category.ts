export const TeamRole = {
    BACKEND: 'Backend',
    FRONTEND: 'Frontend',
    DEV_OPS: 'DevOps',
    FULL_STACK: 'FullStack',
    DATA_ENGINEER: 'DataEngineer',
    INVALID: 'Invalid',
} as const;

export function isTeamRole(value: string): value is TeamRoleType {
    return teamRoleValues.includes(value as TeamRoleType);
}

export function setTeamRole(value: string): TeamRoleType {
    if (!isTeamRole(value)) {
        return TeamRole.INVALID;
    }
    return value;
}

type TeamRoleKey = keyof typeof TeamRole;
export type TeamRoleType = (typeof TeamRole)[TeamRoleKey];
export type ValidTeamRole = Exclude<TeamRoleType, typeof TeamRole.INVALID>;
const teamRoleValues: readonly TeamRoleType[] = Object.values(TeamRole);
