export const ResumeCategory = {
    RESUME: 'RESUME',
    PORTFOLIO: 'PORTFOLIO',
    ICT: 'ICT',
    OTHER: 'OTHER',
} as const;

export type ResumeCategoryType = (typeof ResumeCategory)[keyof typeof ResumeCategory];

export const RESUME_CATEGORY = Object.values(ResumeCategory);