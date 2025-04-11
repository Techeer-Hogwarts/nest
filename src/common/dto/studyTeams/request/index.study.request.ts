import { GetStudyTeamResponse } from '../response/get.studyTeam.response';

export class IndexStudyRequest {
    readonly id: string;
    readonly name: string;
    readonly resultImages: string[];
    readonly studyExplain: string;
    readonly title: string;

    constructor(study: GetStudyTeamResponse) {
        this.id = String(study.id);
        this.name = study.name;
        this.resultImages = study.resultImages.map((image) => image.imageUrl);
        this.studyExplain = study.studyExplain;
        this.title = study.name;
    }
}
