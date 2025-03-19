export const StatusCategory = {
    APPROVED: 'APPROVED',
    REJECT: 'REJECT',
    PENDING: 'PENDING',
} as const;
export type StatusCategory =
    (typeof StatusCategory)[keyof typeof StatusCategory];
export const StackCategory = {
    BACKEND: 'BACKEND',
    FRONTEND: 'FRONTEND',
    DATABASE: 'DATABASE',
    DEVOPS: 'DEVOPS',
    OTHER: 'OTHER',
} as const;
export type StackCategory = (typeof StackCategory)[keyof typeof StackCategory];
