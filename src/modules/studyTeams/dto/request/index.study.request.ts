import { GetStudyTeamResponse } from '../response/get.studyTeam.response';

export class IndexStudyRequest {
    readonly id: string;
    readonly name: string;
    readonly resultImages: string[];
    readonly studyExplain: string;
    readonly teamStacks: string[];
    readonly title: string;

    constructor(study: GetStudyTeamResponse) {
        this.id = String(study.id);
        this.name = study.name;
        this.resultImages = study.resultImages.map((image) => image.imageUrl);
        this.studyExplain = study.studyExplain;
        this.teamStacks = ['해당 변수 제거 요망'];
        this.title = '해당 변수 제거 요망';
    }
}
