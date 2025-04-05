export const MemberStatus = {
    APPROVED: 'APPROVED',
    PENDING: 'PENDING',
    REJECT: 'REJECT',
    CANCELLED: 'CANCELLED',
} as const;

type MemberStatusKey = keyof typeof MemberStatus;
export type MemberStatus = (typeof MemberStatus)[MemberStatusKey];
