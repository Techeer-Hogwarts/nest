export const UserGrade = {
    FIRST_YEAR: '1학년',
    SECOND_YEAR: '2학년',
    THIRD_YEAR: '3학년',
    FOURTH_YEAR: '4학년',
    GRADUATED: '졸업',
    ON_LEAVE: '휴학',
} as const;

export type UserGrade = (typeof UserGrade)[keyof typeof UserGrade];

export const userGradeValues: readonly UserGrade[] = Object.values(UserGrade);

export function isUserGrade(value: string): value is UserGrade {
    return userGradeValues.includes(value as UserGrade);
}
