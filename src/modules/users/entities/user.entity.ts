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
    blogUrl: string;
    mainPosition: string;
    subPosition: string;
    school: string;
    class: string;
    profileImage: string;
    stack: string[];
    isAuth: boolean;
    isIntern: boolean;
    internPosition: string;
    internCompanyName: string;
    internStartDate: Date | null; // 인턴 시작 날짜
    internEndDate: Date | null; // 인턴 종료 날짜
    isFullTime: boolean;
    fullTimeCompanyName: string;
    fullTimePosition: string;
    fullTimeStartDate: Date | null; // 정규직 시작 날짜
    fullTimeEndDate: Date | null; // 정규직 종료 날짜
    roleId: number;
}
