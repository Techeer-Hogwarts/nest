export const ServiceType = {
    RESUME: 'RESUME',
    SESSION: 'SESSION',
    BLOG: 'BLOG',
    PROJECT: 'PROJECT',
    STUDY: 'STUDY',
} as const;
export type ServiceType = (typeof ServiceType)[ServiceTypeKey];
type ServiceTypeKey = keyof typeof ServiceType;
