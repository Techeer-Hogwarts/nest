import { ProjectResultImage, TeamStack } from '@prisma/client';
import { ProjectTeamEntity } from '../../entities/projectTeam.entity';

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

    constructor(project: ProjectTeamEntity) {
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
