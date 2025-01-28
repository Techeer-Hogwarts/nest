import { UserExperience } from '@prisma/client';

export class UserExperienceEntity implements UserExperience {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    userId: number;
    position: string;
    companyName: string;
    startDate: Date;
    endDate: Date;
    category: string;
    isFinished: boolean;
}
