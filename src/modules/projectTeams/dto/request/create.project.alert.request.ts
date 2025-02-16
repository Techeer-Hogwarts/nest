import { CreateProjectAlertRequest } from 'src/modules/alert/dto/request/create.project.alert.request';
import { ProjectTeamDetailResponse } from '../response/get.projectTeam.response';

export interface CreateProjectResult {
    projectResponse: ProjectTeamDetailResponse;
    slackPayload: CreateProjectAlertRequest;
}
