import { Resume, User } from '@prisma/client';

type ResumeWithUser = Resume & { user: User };

export class GetResumeResponse {
    readonly id: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly title: string;
    readonly url: string;
    readonly isMain: boolean;
    readonly category: string;
    readonly position: string;
    readonly likeCount: number;
    readonly viewCount: number;

    readonly user: GetResumeAuthorResponse;

    constructor(resume: ResumeWithUser) {
        this.id = resume.id;
        this.createdAt = resume.createdAt;
        this.updatedAt = resume.updatedAt;
        this.title = resume.title;
        this.url = resume.url;
        this.isMain = resume.isMain;
        this.category = resume.category;
        this.position = resume.position;
        this.likeCount = resume.likeCount;
        this.viewCount = resume.viewCount;
        this.user = new GetResumeAuthorResponse(resume.user);
    }
}

export class GetResumeAuthorResponse {
    readonly id: number;
    readonly name: string;
    readonly nickname: string;
    readonly profileImage: string;
    readonly year: number;
    readonly mainPosition: string;
    readonly subPosition: string;
    readonly school: string;
    readonly grade: string;
    readonly email: string;
    readonly githubUrl: string;
    readonly mediumUrl: string;
    readonly tistoryUrl: string;
    readonly velogUrl: string;
    readonly roleId: number;

    constructor(user: User) {
        this.id = user.id;
        this.name = user.name;
        this.nickname = user.nickname;
        this.profileImage = user.profileImage;
        this.year = user.year;
        this.mainPosition = user.mainPosition;
        this.subPosition = user.subPosition;
        this.school = user.school;
        this.grade = user.grade;
        this.email = user.email;
        this.githubUrl = user.githubUrl;
        this.mediumUrl = user.mediumUrl;
        this.tistoryUrl = user.tistoryUrl;
        this.velogUrl = user.velogUrl;
        this.roleId = user.roleId;
    }
}
