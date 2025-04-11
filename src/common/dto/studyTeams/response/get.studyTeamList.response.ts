import { StudyResultImage } from '@prisma/client';
import { StudyTeamEntity } from '../../../../core/studyTeams/entities/studyTeam.entity';

export class GetStudyTeamListResponse {
    private readonly id: number;
    private readonly name: string;
    private readonly studyExplain: string;
    private readonly isRecruited: boolean;
    private readonly isFinished: boolean;
    private readonly recruitNum: number;
    private readonly recruitExplain: string;
    private readonly resultImages: StudyResultImage[];

    constructor(study: StudyTeamEntity) {
        this.id = study.id;
        this.name = study.name;
        this.studyExplain = study.studyExplain;
        this.isRecruited = study.isRecruited;
        this.isFinished = study.isFinished;
        this.recruitNum = study.recruitNum;
        this.recruitExplain = study.recruitExplain;
        this.resultImages = study.resultImages;
    }
}
