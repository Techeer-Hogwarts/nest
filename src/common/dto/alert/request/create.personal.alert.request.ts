export class CreatePersonalAlertRequest {
    teamId: number;
    teamName: string;
    type: string;
    leaderEmail: string;
    applicantEmail: string;
    result: 'APPROVED' | 'REJECT' | 'PENDING' | 'CANCELLED';
}
