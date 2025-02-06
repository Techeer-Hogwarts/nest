import {
    ProjectTeam,
    ProjectMember,
    TeamStack,
    ProjectResultImage,
    ProjectMainImage,
} from '@prisma/client';

// 기본 응답 포맷 통합
export class BaseResponse<T> {
    constructor(
        public code: number,
        public message: string,
        public data: T,
    ) {}
}

// 상세 조회용 DTO
export class ProjectTeamDetailResponse {
    readonly id: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
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
    readonly uiuxNum: number;
    readonly dataEngineerNum: number;
    readonly recruitExplain: string;
    readonly resultImages: {
        id: number;
        isDeleted: boolean;
        imageUrl: string;
    }[];
    readonly mainImages: { id: number; isDeleted: boolean; imageUrl: string }[];
    readonly teamStacks: { stackName: string; isMain: boolean }[];
    readonly projectMember: {
        id: number;
        name: string;
        isDeleted: boolean;
        isLeader: boolean;
        teamRole: string;
        projectTeamId: number;
        userId: number;
    }[];
    constructor(
        project: ProjectTeam & {
            resultImages: ProjectResultImage[];
            mainImages: ProjectMainImage[];
            teamStacks: (TeamStack & { stack: { name: string } })[];
            projectMember: (ProjectMember & { user: { name: string } })[];
        },
    ) {
        this.id = project.id;
        this.createdAt = project.createdAt;
        this.updatedAt = project.updatedAt;
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
        this.uiuxNum = project.uiuxNum;
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
            stackName: stack.stack.name,
            isMain: stack.isMain,
        }));
        this.projectMember = project.projectMember.map((member) => ({
            id: member.id,
            name: member.user.name,
            isDeleted: member.isDeleted,
            isLeader: member.isLeader,
            teamRole: member.teamRole,
            projectTeamId: member.projectTeamId,
            userId: member.userId,
        }));
    }
}

// 목록 조회용 DTO (간소화 버전)
export class ProjectTeamListResponse {
    readonly id: number;
    readonly name: string;
    readonly isRecruited: boolean;
    readonly mainImages: { id: number; isDeleted: boolean; imageUrl: string }[];
    readonly teamStacks: { stackName: string; isMain: boolean }[];
    readonly projectMember: {
        id: number;
        name: string;
        isDeleted: boolean;
        isLeader: boolean;
        teamRole: string;
        projectTeamId: number;
        userId: number;
    }[];

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

    constructor(member: ProjectMember & { user: { name: string } }) {
        this.id = member.id;
        this.userName = member.user.name;
        this.isLeader = member.isLeader;
        this.teamRole = member.teamRole;
    }
}
