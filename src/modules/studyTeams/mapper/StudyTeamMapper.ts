import { StudyMemberStatus } from '../../studyMembers/category/StudyMemberStatus';
import { CreatePersonalAlertRequest } from '../../alert/dto/request/create.personal.alert.request';
import { GetStudyTeamResponse } from '../dto/response/get.studyTeam.response';
import { CreateStudyAlertRequest } from '../../alert/dto/request/create.study.alert.request';
import { CreateStudyTeamRequest } from '../dto/request/create.studyTeam.request';
import { plainToInstance } from 'class-transformer';
import { UpdateStudyTeamRequest } from '../dto/request/update.studyTeam.request';

export function mapToStudyLeaderAlertPayload(
    studyTeamId: number,
    studyTeamName: string,
    teamLeaders: { user: { email: string } }[], // 전체 리더 목록을 받음
    applicantEmail: string,
    statusResult: StudyMemberStatus,
): CreatePersonalAlertRequest[] {
    return teamLeaders.map((leader, index) => ({
        teamId: studyTeamId,
        teamName: studyTeamName,
        type: 'study',
        leaderEmail: leader.user.email,
        applicantEmail: index === 0 ? applicantEmail : 'Null', // 첫 번째 리더만 신청자 포함
        result: statusResult,
    }));
}
export function mapToStudyAlertPayload(
    response: GetStudyTeamResponse,
    leaderNames: string[],
    leaderEmails: string[],
): CreateStudyAlertRequest {
    return {
        id: response.id,
        type: 'study',
        name: response.name,
        studyExplain: response.studyExplain,
        recruitNum: response.recruitNum,
        leader: leaderNames,
        email: leaderEmails,
        recruitExplain: response.recruitExplain,
        notionLink: response.notionLink,
        goal: response.goal,
        rule: response.rule,
    };
}
export function plainToCreateStudyTeamRequest(
    createRequest: string,
): CreateStudyTeamRequest {
    return plainToInstance(CreateStudyTeamRequest, JSON.parse(createRequest));
}

export function plainToUpdateStudyTeamRequest(
    updateRequest: string,
): UpdateStudyTeamRequest {
    return plainToInstance(UpdateStudyTeamRequest, JSON.parse(updateRequest));
}
