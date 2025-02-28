import { PagableMeta } from '../../../../global/pagable/pageble-meta';

export class GetAllTeamsResponse {
    teams: (FormattedProject | FormattedStudy)[];
    meta: PagableMeta;

    constructor(
        teams: (FormattedProject | FormattedStudy)[],
        meta: PagableMeta,
    ) {
        this.teams = teams;
        this.meta = meta;
    }
}

export class FormattedProject {
    type: string;
    createdAt: Date;
    id: string;
    isDeleted: boolean;
    isRecruited: boolean;
    isFinished: boolean;
    name: string;
    frontendNum: number;
    backendNum: number;
    devopsNum: number;
    fullStackNum: number;
    dataEngineerNum: number;
    projectExplain: string;
    mainImages: string[];
    teamStacks: { stackName: string; isMain: boolean }[];

    constructor(project: any) {
        this.type = 'project';
        this.createdAt = project.createdAt;
        this.id = project.id;
        this.isDeleted = project.isDeleted;
        this.isRecruited = project.isRecruited;
        this.isFinished = project.isFinished;
        this.name = project.name;
        this.frontendNum = project.frontendNum;
        this.backendNum = project.backendNum;
        this.devopsNum = project.devopsNum;
        this.fullStackNum = project.fullStackNum;
        this.dataEngineerNum = project.dataEngineerNum;
        this.projectExplain = project.projectExplain;
        this.mainImages = project.mainImages.map(
            (image: any) => image.imageUrl,
        );
        this.teamStacks = project.teamStacks.map((stack: any) => ({
            stackName: stack.stack.name,
            isMain: stack.isMain,
        }));
    }
}

export class FormattedStudy {
    type: string;
    createdAt: Date;
    id: string;
    isDeleted: boolean;
    isRecruited: boolean;
    isFinished: boolean;
    name: string;
    recruitNum: number;
    studyExplain: string;

    constructor(study: any) {
        this.type = 'study';
        this.createdAt = study.createdAt;
        this.id = study.id;
        this.isDeleted = study.isDeleted;
        this.isRecruited = study.isRecruited;
        this.isFinished = study.isFinished;
        this.name = study.name;
        this.recruitNum = study.recruitNum;
        this.studyExplain = study.studyExplain;
    }
}
