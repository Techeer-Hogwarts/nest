export const StackCategory = {
    BACKEND: 'BACKEND',
    FRONTEND: 'FRONTEND',
    DEVOPS: 'DEVOPS',
    FULL_STACK: 'FULL_STACK',
    DATA_ENGINEER: 'DATA_ENGINEER',
} as const;

export type StackCategory = (typeof StackCategory)[keyof typeof StackCategory];

export const stackCategoryValues: readonly StackCategory[] =
    Object.values(StackCategory);

export function isStackCategory(value: string): value is StackCategory {
    return stackCategoryValues.includes(value as StackCategory);
}
