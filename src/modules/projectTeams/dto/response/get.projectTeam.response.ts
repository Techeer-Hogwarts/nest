import {
    ProjectTeam,
    ProjectMember,
    TeamStack,
    ProjectResultImage,
    ProjectMainImage,
    StatusCategory,
} from '@prisma/client';
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
    readonly uiuxNum: number;
    readonly dataEngineerNum: number;
    readonly recruitExplain: string;
    readonly resultImages: {
        id: number;
        isDeleted: boolean;
        imageUrl: string;
    }[];

    readonly mainImages: {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
        imageUrl: string;
        projectTeamId: number;
    }[];
    readonly teamStacks: {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
        projectTeamId: number;
        isMain: boolean;
        stackId: number;
        stack: { name: string };
    }[];

    readonly projectMember: {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isDeleted: boolean;
        isLeader: boolean;
        teamRole: string;
        projectTeamId: number;
        userId: number;
        summary: string;
        status: StatusCategory;
        user: { name: string };
    }[];
    constructor(
        project: ProjectTeam & {
            resultImages: (ProjectResultImage & {
                projectTeamId: number;
            })[];
            mainImages: (ProjectMainImage & {
                projectTeamId: number;
                createdAt: Date;
                updatedAt: Date;
            })[];
            teamStacks: (TeamStack & {
                stack: { name: string };
                projectTeamId: number;
                createdAt: Date;
                updatedAt: Date;
            })[];
            projectMember: (ProjectMember & {
                user: { name: string };
                projectTeamId: number;
                createdAt: Date;
                updatedAt: Date;
                summary: string;
                status: StatusCategory;
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
            createdAt: image.createdAt,
            updatedAt: image.updatedAt,
            isDeleted: image.isDeleted,
            imageUrl: image.imageUrl,
            projectTeamId: image.projectTeamId,
        }));
        this.teamStacks = project.teamStacks.map((stack) => ({
            id: stack.id,
            createdAt: stack.createdAt,
            updatedAt: stack.updatedAt,
            isDeleted: stack.isDeleted,
            projectTeamId: stack.projectTeamId,
            isMain: stack.isMain,
            stackId: stack.id,
            stack: { name: stack.stack.name },
        }));

        this.projectMember = project.projectMember.map((member) => ({
            id: member.id,
            createdAt: member.createdAt,
            updatedAt: member.updatedAt,
            name: member.user.name,
            isDeleted: member.isDeleted,
            isLeader: member.isLeader,
            teamRole: member.teamRole,
            projectTeamId: member.projectTeamId,
            userId: member.userId,
            summary: member.summary,
            status: member.status,
            user: member.user,
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
