import { StatusCategory } from '@prisma/client';

export class ApplicantDetailAndEmail {
    readonly id: number;
    readonly email: string;
    readonly status: StatusCategory;
    readonly isDeleted: boolean;

    constructor(applicant: {
        user: { email: string };
        id: number;
        status: StatusCategory;
    }) {
        this.id = applicant.id;
        this.email = applicant.user.email;
        this.status = applicant.status;
    }
}

export class ApplicantDetail {
    readonly id: number;
    readonly status: StatusCategory;
    readonly isDeleted: boolean;

    constructor(applicant: {
        id: number;
        isDeleted: boolean;
        status: StatusCategory;
    }) {
        this.id = applicant.id;
        this.isDeleted = applicant.isDeleted;
        this.status = applicant.status;
    }
}
