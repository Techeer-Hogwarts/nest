import { CreateProjectAlertRequest } from '../dto/alert/request/create.project.alert.request';
import { ProjectTeamDetailResponse } from '../dto/projectTeams/response/get.projectTeam.response';
import { CreatePersonalAlertRequest } from '../dto/alert/request/create.personal.alert.request';
import { MemberStatus } from '../category/member.category';
import { ContentCategory } from '../category/content.category';

export function mapToTeamLeaderAlertPayload(
    teamType: ContentCategory,
    teamId: number,
    teamName: string,
    teamLeaders: { user: { email: string } }[], // 전체 리더 목록을 받음
    applicantEmail: string,
    statusResult: MemberStatus,
): CreatePersonalAlertRequest[] {
    return teamLeaders.map((leader, index) => ({
        teamId: teamId,
        teamName: teamName,
        type: teamType,
        leaderEmail: leader.user.email,
        applicantEmail: index === 0 ? applicantEmail : 'Null', // 첫 번째 리더만 신청자 포함
        result: statusResult,
    }));
}

export function mapToTeamAlertPayload(
    teamType: ContentCategory,
    response: ProjectTeamDetailResponse,
    leaderNames: string[],
    leaderEmails: string[],
): CreateProjectAlertRequest {
    return {
        id: response.id,
        type: teamType,
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
