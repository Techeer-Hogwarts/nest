import { MemberStatus } from '../../../category/teamCategory/member.category';

export class CreatePersonalAlertRequest {
    teamId: number;
    teamName: string;
    type: string;
    leaderEmail: string;
    applicantEmail: string;
    result: MemberStatus;
}
