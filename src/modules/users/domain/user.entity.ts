import { User } from '@prisma/client';

export class UserEntity implements User {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    name: string;
    email: string;
    year: number;
    password: string;
    isLft: boolean;
    githubUrl: string;
    blogUrl: string;
    mainPosition: string;
    subPosition: string;
    school: string;
    class: string;
    roleId: number;
}
