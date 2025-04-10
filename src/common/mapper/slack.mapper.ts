import { CreateProjectAlertRequest } from '../dto/alert/request/create.project.alert.request';
import { ProjectTeamDetailResponse } from '../dto/projectTeams/response/get.projectTeam.response';
import { CreatePersonalAlertRequest } from '../dto/alert/request/create.personal.alert.request';
import { MemberStatus } from '../category/teamCategory/member.category';
import { GetStudyTeamResponse } from '../dto/studyTeams/response/get.studyTeam.response';
import { CreateStudyAlertRequest } from '../dto/alert/request/create.study.alert.request';
import { TeamType } from '../category/teamCategory/teamType';

export function mapToTeamLeaderAlertPayload(
    type: TeamType,
    teamId: number,
    teamName: string,
    teamLeaders: { user: { email: string } }[], // 전체 리더 목록을 받음
    applicantEmail: string,
    statusResult: MemberStatus,
): CreatePersonalAlertRequest[] {
    return teamLeaders.map((leader, index) => ({
        type: type,
        teamId: teamId,
        teamName: teamName,
        leaderEmail: leader.user.email,
        applicantEmail: index === 0 ? applicantEmail : 'Null',
        result: statusResult,
    }));
}

export function mapToProjectTeamAlertPayload(
    response: ProjectTeamDetailResponse,
    leaderNames: string[],
    leaderEmails: string[],
): CreateProjectAlertRequest {
    return {
        id: response.id,
        type: TeamType.PROJECT,
        name: response.name,
        projectExplain: response.projectExplain,
        frontNum: response.frontendNum,
        backNum: response.backendNum,
        dataEngNum: response.dataEngineerNum,
        devOpsNum: response.devopsNum,
        fullStackNum: response.fullStackNum,
        leader: leaderNames,
        email: leaderEmails,
        recruitExplain: response.recruitExplain,
        notionLink: response.notionLink,
        stack: response.teamStacks.map((teamStack) => teamStack.stack.name),
    };
}

export function mapToStudyAlertPayload(
    response: GetStudyTeamResponse,
    leaderNames: string[],
    leaderEmails: string[],
): CreateStudyAlertRequest {
    return {
        id: response.id,
        type: TeamType.STUDY,
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
