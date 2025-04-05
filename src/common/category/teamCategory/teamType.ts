export const TeamType = {
    PROJECT: 'project',
    STUDY: 'study',
} as const;

export type TeamType = (typeof TeamType)[keyof typeof TeamType];
export const teamTypeValues: readonly TeamType[] = Object.values(TeamType);

export function isTeamType(value: string): value is TeamType {
    return teamTypeValues.includes(value as TeamType);
}
