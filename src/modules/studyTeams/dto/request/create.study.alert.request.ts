import { GetStudyTeamResponse } from '../response/get.studyTeam.response';
import { CreateStudyAlertRequest } from 'src/modules/alert/dto/request/create.study.alert.request';

export interface CreateStudyResult {
    studyResponse: GetStudyTeamResponse;
    slackPayload: CreateStudyAlertRequest;
}
