import { StatusCategory } from '@prisma/client';

interface ApplicantInfo {
    id: number;
    status: StatusCategory;
}

export class ApplicantSummaryResponse implements ApplicantInfo {
    readonly id: number;
    readonly status: StatusCategory;
    readonly email: string;

    constructor(applicant: {
        user: { email: string };
        id: number;
        status: StatusCategory;
    }) {
        this.id = applicant.id;
        this.status = applicant.status;
        this.email = applicant.user.email;
    }
}

export class ApplicantDetailResponse implements ApplicantInfo {
    readonly id: number;
    readonly status: StatusCategory;
    readonly isDeleted: boolean;

    constructor(applicant: {
        id: number;
        isDeleted: boolean;
        status: StatusCategory;
    }) {
        this.id = applicant.id;
        this.status = applicant.status;
        this.isDeleted = applicant.isDeleted;
    }
}
