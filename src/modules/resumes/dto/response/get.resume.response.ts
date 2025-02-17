import { ResumeEntity } from '../../entities/resume.entity';
import { UserEntity } from '../../../users/entities/user.entity';

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

    constructor(resume: ResumeEntity) {
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
    readonly roleId: number;

    constructor(user: UserEntity) {
        this.id = user.id;
        this.name = user.name;
        this.nickname = user.nickname;
        this.profileImage = user.profileImage;
        this.year = user.year;
        this.mainPosition = user.mainPosition;
        this.subPosition = user.subPosition;
        this.roleId = user.roleId;
    }
}
