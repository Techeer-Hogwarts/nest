import { ResumeEntity } from '../../entities/resume.entity';

export class IndexResumeRequest {
    readonly createdAt: string;
    readonly id: string;
    readonly title: string;
    readonly url: string;
    readonly userID: string;
    readonly userName: string;
    readonly userProfileImage: string;
    readonly year: string;
    readonly position: string;

    constructor(resume: ResumeEntity) {
        this.createdAt = String(resume.createdAt);
        this.id = String(resume.id);
        this.title = resume.title;
        this.url = resume.url;
        this.userID = String(resume.user.id);
        this.userName = resume.user.name;
        this.userProfileImage = resume.user.profileImage;
        this.year = String(resume.user.year);
        this.position = resume.user.mainPosition;
    }
}
