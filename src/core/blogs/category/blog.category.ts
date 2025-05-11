export const BlogCategory = {
    TECHEER: 'TECHEER',
    SHARED: 'SHARED',
} as const;

export type BlogCategory = (typeof BlogCategory)[keyof typeof BlogCategory];
