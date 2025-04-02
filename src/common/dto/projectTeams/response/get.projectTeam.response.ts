import {
    ProjectTeam,
    ProjectMember,
    TeamStack,
    ProjectResultImage,
    ProjectMainImage,
    StatusCategory,
} from '@prisma/client';
import { Exclude } from 'class-transformer';

// 상세 조회용 DTO
export class ProjectTeamDetailResponse {
    readonly id: number;
    readonly isDeleted: boolean;
    readonly isRecruited: boolean;
    readonly isFinished: boolean;
    readonly name: string;
    readonly githubLink: string;
    readonly notionLink: string;
    readonly projectExplain: string;
    readonly frontendNum: number;
    readonly backendNum: number;
    readonly devopsNum: number;
    readonly fullStackNum: number;
    readonly dataEngineerNum: number;
    readonly recruitExplain: string;
    readonly resultImages: {
        id: number;
        isDeleted: boolean;
        imageUrl: string;
    }[];

    readonly mainImages: {
        id: number;
        isDeleted: boolean;
        imageUrl: string;
    }[];
    readonly teamStacks: {
        id: number;
        isDeleted: boolean;
        projectTeamId: number;
        isMain: boolean;
        stack: { name: string; category?: string };
    }[];
    readonly projectMember: {
        id: number;
        name: string;
        isLeader: boolean;
        teamRole: string;
        userId: number;
        email: string;
        profileImage: string;
    }[];
    readonly likeCount: number;
    readonly viewCount: number;

    constructor(
        project: ProjectTeam & {
            resultImages: (ProjectResultImage & {
                projectTeamId: number;
            })[];
            mainImages: (ProjectMainImage & {
                projectTeamId: number;
            })[];
            teamStacks: (TeamStack & {
                stack: { name: string; category?: string };
                projectTeamId: number;
            })[];
            projectMember: (ProjectMember & {
                user: {
                    id: number;
                    name: string;
                    email: string;
                    year: number;
                    profileImage: string;
                };
                projectTeamId: number;
            })[];
        },
    ) {
        this.id = project.id;
        this.isDeleted = project.isDeleted;
        this.isRecruited = project.isRecruited;
        this.isFinished = project.isFinished;
        this.name = project.name;
        this.githubLink = project.githubLink;
        this.notionLink = project.notionLink;
        this.projectExplain = project.projectExplain;
        this.frontendNum = project.frontendNum;
        this.backendNum = project.backendNum;
        this.devopsNum = project.devopsNum;
        this.fullStackNum = project.fullStackNum;
        this.dataEngineerNum = project.dataEngineerNum;
        this.recruitExplain = project.recruitExplain;
        this.resultImages = project.resultImages.map((image) => ({
            id: image.id,
            isDeleted: image.isDeleted,
            imageUrl: image.imageUrl,
        }));
        this.mainImages = project.mainImages.map((image) => ({
            id: image.id,
            isDeleted: image.isDeleted,
            imageUrl: image.imageUrl,
        }));
        this.teamStacks = project.teamStacks.map((stack) => ({
            id: stack.id,
            isDeleted: stack.isDeleted,
            projectTeamId: stack.projectTeamId,
            isMain: stack.isMain,
            stack: {
                name: stack.stack.name,
                category: stack.stack.category,
            },
        }));

        this.projectMember = project.projectMember.map((member) => ({
            id: member.id,
            name: member.user.name,
            isLeader: member.isLeader,
            teamRole: member.teamRole,
            userId: member.userId,
            email: member.user.email,
            year: member.user.year,
            profileImage: member.user.profileImage,
        }));
        this.likeCount = project.likeCount;
        this.viewCount = project.viewCount;
    }
}

export class ProjectTeamDetailResponse2 {
    readonly id: number;
    readonly isDeleted: boolean;
    readonly isRecruited: boolean;
    readonly isFinished: boolean;
    readonly name: string;
    readonly githubLink: string;
    readonly notionLink: string;
    readonly projectExplain: string;
    readonly frontendNum: number;
    readonly backendNum: number;
    readonly devopsNum: number;
    readonly fullStackNum: number;
    readonly dataEngineerNum: number;
    readonly recruitExplain: string;
    readonly resultImages: {
        id: number;
        isDeleted: boolean;
        imageUrl: string;
    }[];
    readonly mainImages: {
        id: number;
        isDeleted: boolean;
        imageUrl: string;
    }[];
    readonly teamStacks: {
        id: number;
        isDeleted: boolean;
        projectTeamId: number;
        isMain: boolean;
        stack: { name: string; category?: string }; // 변경: category 필드 optional
    }[];
    readonly projectMember: {
        id: number;
        name: string;
        isLeader: boolean;
        teamRole: string;
        status?: string;
    }[];
    readonly likeCount: number;
    readonly viewCount: number;

    constructor(
        project: ProjectTeam & {
            resultImages: (ProjectResultImage & { projectTeamId: number })[];
            mainImages: (ProjectMainImage & { projectTeamId: number })[];
            teamStacks: (TeamStack & {
                stack: { name: string; category?: string }; // 변경: category 필드 optional
                projectTeamId: number;
            })[];
            projectMembers: (ProjectMember & {
                user: { name: string };
                projectTeamId: number;
                status?: string;
            })[];
        },
    ) {
        this.id = project.id;
        this.isDeleted = project.isDeleted;
        this.isRecruited = project.isRecruited;
        this.isFinished = project.isFinished;
        this.name = project.name;
        this.githubLink = project.githubLink;
        this.notionLink = project.notionLink;
        this.projectExplain = project.projectExplain;
        this.frontendNum = project.frontendNum;
        this.backendNum = project.backendNum;
        this.devopsNum = project.devopsNum;
        this.fullStackNum = project.fullStackNum;
        this.dataEngineerNum = project.dataEngineerNum;
        this.recruitExplain = project.recruitExplain;
        this.resultImages = project.resultImages.map((image) => ({
            id: image.id,
            isDeleted: image.isDeleted,
            imageUrl: image.imageUrl,
        }));
        this.mainImages = project.mainImages.map((image) => ({
            id: image.id,
            isDeleted: image.isDeleted,
            imageUrl: image.imageUrl,
        }));
        this.teamStacks = project.teamStacks.map((stack) => ({
            id: stack.id,
            isDeleted: stack.isDeleted,
            projectTeamId: stack.projectTeamId,
            isMain: stack.isMain,
            stack: {
                name: stack.stack.name,
                category: stack.stack.category,
            },
        }));
        // `projectMembers`를 `projectMember`로 변환
        this.projectMember = project.projectMembers.map((member) => ({
            id: member.id,
            name: member.user.name,
            isLeader: member.isLeader,
            teamRole: member.teamRole,
            status: member.status,
        }));
        this.likeCount = project.likeCount;
        this.viewCount = project.viewCount;
    }
}

// 목록 조회용 DTO
export class ProjectTeamListResponse {
    readonly id: number;
    readonly name: string;
    readonly isRecruited: boolean;
    readonly mainImages: { id: number; isDeleted: boolean; imageUrl: string }[];
    readonly teamStacks: { stackName: string; isMain: boolean }[];

    constructor(
        project: ProjectTeam & {
            mainImages: ProjectMainImage[];
            teamStacks: (TeamStack & { stack: { name: string } })[];
        },
    ) {
        this.id = project.id;
        this.name = project.name;
        this.isRecruited = project.isRecruited;
        this.mainImages = project.mainImages.map((image) => ({
            id: image.id,
            isDeleted: image.isDeleted,
            imageUrl: image.imageUrl,
        }));
        this.teamStacks = project.teamStacks.map((stack) => ({
            isMain: stack.isMain,
            stackName: stack.stack.name,
        }));
    }
}

// 멤버 조회 DTO
export class ProjectMemberResponse {
    id: number;
    userName: string;
    isLeader: boolean;
    teamRole: string;
    profileImage: string;
    status?: StatusCategory;
    userId?: number;

    constructor(
        member: ProjectMember & {
            user: { name: string; profileImage: string };
        },
    ) {
        this.id = member.id;
        this.userName = member.user.name;
        this.isLeader = member.isLeader;
        this.teamRole = member.teamRole;
        this.profileImage = member.user.profileImage;
        this.status = member.status;
        this.userId = member.userId;
    }
}

export class AcceptedApplicantResponse implements Partial<ProjectMember> {
    id: number;
    isLeader: boolean;
    teamRole: string;
    summary: string;
    status: StatusCategory;

    @Exclude()
    projectTeamId?: number;
    @Exclude()
    userId?: number;
    @Exclude()
    isDeleted?: boolean;
    @Exclude()
    createdAt?: Date;
    @Exclude()
    updatedAt?: Date;
}

export class ProjectApplicantResponse {
    id: number;
    name: string;
    userId: number;
    isLeader: boolean;
    teamRole: string;
    summary: string;
    status: StatusCategory;
    profileImage: string;
    year: number;

    constructor(
        member: AcceptedApplicantResponse & {
            user: {
                id: number;
                name: string;
                profileImage: string;
                year: number;
            };
        },
    ) {
        this.id = member.id;
        this.userId = member.user.id;
        this.name = member.user.name;
        this.isLeader = member.isLeader;
        this.teamRole = member.teamRole;
        this.summary = member.summary;
        this.status = member.status;
        this.profileImage = member.user.profileImage;
        this.year = member.user.year;
    }
}
