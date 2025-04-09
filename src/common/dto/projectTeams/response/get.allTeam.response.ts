import { TeamType } from '../../../category/teamCategory/teamType';

export interface TeamGetAllResponse {
    id: number;
    name: string;
    isDeleted: boolean;
    isFinished: boolean;
    isRecruited: boolean;
    createdAt: Date;
    type: TeamType;
}

export class ProjectTeamGetAllResponse implements TeamGetAllResponse {
    readonly id: number;
    readonly name: string;
    readonly projectExplain: string;
    readonly isDeleted: boolean;
    readonly isFinished: boolean;
    readonly isRecruited: boolean;
    readonly frontendNum: number;
    readonly backendNum: number;
    readonly devopsNum: number;
    readonly fullStackNum: number;
    readonly dataEngineerNum: number;
    readonly mainImages: string[];
    readonly teamStacks: { stackName: string; isMain: boolean }[];
    readonly createdAt: Date;
    readonly type: TeamType;

    constructor(projectData: ProjectTeamGetAllData) {
        this.id = projectData.id;
        this.name = projectData.name;
        this.createdAt = projectData.createdAt;
        this.projectExplain = projectData.projectExplain;
        this.isDeleted = projectData.isDeleted;
        this.isRecruited = projectData.isRecruited ?? true;
        this.isFinished = projectData.isFinished ?? true;
        this.frontendNum = projectData.frontendNum;
        this.backendNum = projectData.backendNum;
        this.devopsNum = projectData.devopsNum;
        this.fullStackNum = projectData.fullStackNum;
        this.dataEngineerNum = projectData.dataEngineerNum;

        this.mainImages = projectData.mainImages.map((img) => img.imageUrl);
        this.teamStacks = projectData.teamStacks.map((stack) => ({
            stackName: stack.stack.name,
            isMain: stack.isMain,
        }));

        this.type = TeamType.PROJECT;
    }
}

export class StudyTeamGetAllResponse implements TeamGetAllResponse {
    readonly id: number;
    readonly name: string;
    readonly studyExplain: string;
    readonly isDeleted: boolean;
    readonly isFinished: boolean;
    readonly isRecruited: boolean;
    readonly recruitNum: number;
    readonly createdAt: Date;
    readonly type: TeamType;

    constructor(studyData: StudyTeamGetAllData) {
        this.id = studyData.id;
        this.name = studyData.name;
        this.studyExplain = studyData.studyExplain;
        this.isDeleted = studyData.isDeleted;
        this.isFinished = studyData.isFinished ?? true;
        this.isRecruited = studyData.isRecruited ?? true;
        this.isRecruited = studyData.isRecruited;
        this.recruitNum = studyData.recruitNum;
        this.createdAt = studyData.createdAt;
        this.type = TeamType.STUDY;
    }
}

export type ProjectTeamGetAllData = {
    id: number;
    name: string;
    createdAt: Date;
    projectExplain: string;
    isDeleted: boolean;
    isRecruited?: boolean;
    isFinished?: boolean;
    frontendNum: number;
    backendNum: number;
    devopsNum: number;
    fullStackNum: number;
    dataEngineerNum: number;
    mainImages: { imageUrl: string }[];
    teamStacks: {
        stack: {
            name: string;
        };
        isMain: boolean;
    }[];
};

export type StudyTeamGetAllData = {
    id: number;
    name: string;
    studyExplain: string;
    isDeleted: boolean;
    isFinished: boolean;
    isRecruited: boolean;
    recruitNum: number;
    createdAt: Date;
};
