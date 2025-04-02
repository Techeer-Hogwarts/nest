import { User } from '@prisma/client';

export class UserEntity implements User {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    name: string;
    email: string;
    nickname: string;
    year: number;
    password: string;
    isLft: boolean;
    githubUrl: string;
    velogUrl: string;
    mediumUrl: string;
    tistoryUrl: string;
    mainPosition: string;
    subPosition: string;
    school: string;
    grade: string;
    profileImage: string;
    stack: string[];
    isAuth: boolean;
    roleId: number;
    projectMembers?: any[];
    studyMembers?: any[];
    experiences?: any[];
}
