import { User } from '@prisma/client';

export class UserEntity implements User {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    profile: string;
    name: string;
    nickname: string;
    email: string;
    password: string;
    isActive: boolean;
    year: number;
    isLft: boolean;
    role: string;
}
