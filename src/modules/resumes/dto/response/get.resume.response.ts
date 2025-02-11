import { Prisma } from '@prisma/client';

type ResumeWithUser = Prisma.ResumeGetPayload<{
    include: {
        user: {
            select: {
                id: true;
                name: true;
                nickname: true;
                roleId: true;
                profileImage: true;
            };
        };
    };
}>;

export class GetResumeResponse {
    readonly id: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly title: string;
    readonly url: string;
    readonly likeCount: number;
    readonly viewCount: number;
    readonly category: string;

    readonly user: GetResumeAuthorResponse;

    constructor(resume: ResumeWithUser) {
        this.id = resume.id;
        this.createdAt = resume.createdAt;
        this.updatedAt = resume.updatedAt;
        this.title = resume.title;
        this.url = resume.url;
        this.likeCount = resume.likeCount;
        this.viewCount = resume.viewCount;
        this.category = resume.category;
        this.user = new GetResumeAuthorResponse(resume.user);
    }
}

export class GetResumeAuthorResponse {
    readonly id: number;
    readonly name: string;
    readonly nickname: string;
    readonly roleId: number;
    readonly profileImage: string;

    constructor(user: ResumeWithUser['user']) {
        this.id = user.id;
        this.name = user.name;
        this.nickname = user.nickname;
        this.roleId = user.roleId;
        this.profileImage = user.profileImage;
    }
}
