import { ProjectTeamDetailResponse } from '../response/get.projectTeam.response';

export class IndexProjectRequest {
    readonly id: string;
    readonly name: string;
    readonly projectExplain: string;
    readonly resultImages: string[];
    readonly teamStacks: string[];
    readonly title: string;

    constructor(project: ProjectTeamDetailResponse) {
        this.id = String(project.id);
        this.name = project.name;
        this.projectExplain = project.projectExplain;
        this.resultImages = project.resultImages.map((image) => image.imageUrl);
        this.teamStacks = project.teamStacks.map((stack) => stack.stack.name);
        this.title = project.name;
    }
}
