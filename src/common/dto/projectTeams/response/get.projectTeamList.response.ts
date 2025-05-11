import { ProjectResultImage, TeamStack, ProjectTeam } from '@prisma/client';

type ProjectTeamWithRelations = ProjectTeam & {
    resultImages: ProjectResultImage[];
    teamStacks: TeamStack[];
};

export class GetProjectTeamListResponse {
    private readonly id: number;
    private readonly name: string;
    private readonly frontendNum: number;
    private readonly backendNum: number;
    private readonly devopsNum: number;
    private readonly fullStackNum: number;
    private readonly dataEngineerNum: number;
    private readonly projectExplain: string;
    private readonly recruitExplain: string;
    private readonly resultImages: ProjectResultImage[];
    private readonly teamStacks: TeamStack[];

    constructor(project: ProjectTeamWithRelations) {
        this.id = project.id;
        this.name = project.name;
        this.frontendNum = project.frontendNum;
        this.backendNum = project.backendNum;
        this.devopsNum = project.devopsNum;
        this.fullStackNum = project.fullStackNum;
        this.dataEngineerNum = project.dataEngineerNum;
        this.projectExplain = project.projectExplain;
        this.recruitExplain = project.recruitExplain;
        this.resultImages = project.resultImages;
        this.teamStacks = project.teamStacks;
    }
}
