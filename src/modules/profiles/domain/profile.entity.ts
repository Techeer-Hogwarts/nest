import { Profile } from '@prisma/client';

export class ProfileEntity implements Profile {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    userId: number;
    nickname: string;
    profileImage: string;
    experience: string;
    company: string;
    stack: string;
}
