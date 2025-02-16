import {
    StatusCategory,
    StudyMember,
    StudyResultImage,
    StudyTeam,
} from '@prisma/client';

export class GetStudyTeamResponse {
    readonly id: number;
    readonly name: string;
    readonly notionLink: string;
    readonly recruitExplain: string;
    readonly recruitNum: number;
    readonly rule: string;
    readonly goal: string;
    readonly studyExplain: string;
    isRecruited: boolean;
    readonly isFinished: boolean;
    readonly resultImages: {
        id: number;
        isDeleted: boolean;
        imageUrl: string;
    }[];
    readonly studyMember: {
        id: number;
        name: string;
        isDeleted: boolean;
        isLeader: boolean;
        studyTeamId: number;
        userId: number;
        email: string;
    }[];
    readonly likeCount: number;
    readonly viewCount: number;

    constructor(
        studyTeam: StudyTeam & {
            resultImages: StudyResultImage[];
            studyMember: (StudyMember & {
                user: { name: string; email: string };
            })[];
        },
    ) {
        this.id = studyTeam.id;
        this.name = studyTeam.name;
        this.notionLink = studyTeam.notionLink;
        this.recruitExplain = studyTeam.recruitExplain;
        this.recruitNum = studyTeam.recruitNum;
        this.rule = studyTeam.rule;
        this.goal = studyTeam.goal;
        this.studyExplain = studyTeam.studyExplain;
        this.isRecruited = studyTeam.isRecruited;
        this.isFinished = studyTeam.isFinished;
        this.resultImages = studyTeam.resultImages.map((image) => ({
            id: image.id,
            isDeleted: image.isDeleted,
            imageUrl: image.imageUrl,
        }));
        this.studyMember = studyTeam.studyMember.map((member) => ({
            id: member.id,
            name: member.user.name,
            isDeleted: member.isDeleted,
            isLeader: member.isLeader,
            studyTeamId: member.studyTeamId,
            userId: member.userId,
            email: member.user.email,
        }));
        this.likeCount = studyTeam.likeCount;
        this.viewCount = studyTeam.viewCount;
    }
}

export class StudyMemberResponse {
    readonly id: number;
    readonly name: string;
    readonly isLeader: boolean;

    constructor(member: StudyMember & { user: { name: string } }) {
        this.id = member.id;
        this.name = member.user.name;
        this.isLeader = member.isLeader;
    }
}

export class StudyApplicantResponse {
    readonly id: number;
    readonly name: string;
    readonly isLeader: boolean;
    readonly summary: string;
    readonly status: StatusCategory;

    constructor(member: StudyMember & { user: { name: string } }) {
        this.id = member.id;
        this.name = member.user.name;
        this.isLeader = member.isLeader;
        this.summary = member.summary;
        this.status = member.status;
    }
}
