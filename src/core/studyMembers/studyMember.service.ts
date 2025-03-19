import { Injectable } from '@nestjs/common';
import { StatusCategory } from '@prisma/client';

import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import {
    StudyMemberIsActiveMemberException,
    StudyMemberNotFoundException,
} from './exception/study-member.exception';
import { StudyTeamMissingLeaderException } from '../studyTeams/exception/studyTeam.exception';
import { StudyMemberStatus } from './category/StudyMemberStatus';

import { PrismaService } from '../../infra/prisma/prisma.service';

import { CreateStudyMemberRequest } from '../../common/dto/studyMembers/request/create.studyMember.request';

import {
    ApplicantSummaryResponse,
    ApplicantDetailResponse,
} from '../../common/dto/studyMembers/response/get.applicant.studyMember.response';
import {
    StudyApplicantResponse,
    StudyLeadersMailResponse,
    StudyMemberResponse,
} from '../../common/dto/studyTeams/response/get.studyTeam.response';

@Injectable()
export class StudyMemberService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    /** 스터디 팀 멤버 전체 조회 **/
    async getStudyMembersByStudyTeamId(
        studyTeamId: number,
    ): Promise<StudyMemberResponse[]> {
        const studyMembers = await this.prisma.studyMember.findMany({
            where: {
                studyTeamId: studyTeamId,
                isDeleted: false,
                status: StudyMemberStatus.APPROVED,
            },
            include: {
                user: {
                    select: { name: true },
                },
            },
        });

        if (studyMembers.length === 0) {
            throw new StudyMemberNotFoundException();
        }
        this.logger.debug(
            '스터디 pk로 멤버 전체 조회: 스터디 팀 활동 멤버 확인 완료',
        );

        return studyMembers.map((member) => new StudyMemberResponse(member));
    }

    /** 스터디 팀 리더 이메일 전체 조회 **/
    async getAllStudyLeadersEmailByTeamId(
        studyTeamId: number,
    ): Promise<StudyLeadersMailResponse[]> {
        const leaders = await this.prisma.studyMember.findMany({
            where: {
                studyTeamId: studyTeamId,
                isDeleted: false,
                isLeader: true,
                status: StudyMemberStatus.APPROVED,
            },
            select: {
                user: {
                    select: {
                        email: true,
                    },
                },
            },
        });
        // 스터디에 리더는 최소 한명 이상, 불가능
        if (leaders.length === 0) {
            throw new StudyTeamMissingLeaderException();
        }
        this.logger.debug('스터디 팀 리더 이메일 전체 조회: 이메일 조회 완료');
        return leaders.map(
            (leader) => new StudyLeadersMailResponse(leader.user),
        );
    }

    /** 스터디 지원 취소 **/
    async cancelStudyApplication(
        studyMemberId: number,
    ): Promise<StudyMemberResponse> {
        const cancelledStudyMember = await this.prisma.studyMember.update({
            where: {
                id: studyMemberId,
            },
            data: {
                isDeleted: true,
            },
            include: {
                user: {
                    select: { name: true },
                },
            },
        });
        this.logger.debug('스터디 지원 취소: 이메일 조회 완료');

        return new StudyMemberResponse(cancelledStudyMember);
    }

    /** 스터디 팀 지원 **/
    async applyToStudyTeam(
        createStudyMemberRequest: CreateStudyMemberRequest,
        userId: number,
    ): Promise<StudyApplicantResponse> {
        const { studyTeamId, summary } = createStudyMemberRequest;
        // 이미 승인된 신청(또는 멤버인 경우)는 재신청을 막음
        const isActive = await this.isActiveStudyMember(studyTeamId, userId);
        if (isActive) {
            throw new StudyMemberIsActiveMemberException();
        }
        this.logger.debug('스터디 팀 지원: 지원자 검증 완료');

        // upsert를 사용하여 기존 내역이 있으면 업데이트, 없으면 새로 생성
        const upsertedApplication = await this.prisma.studyMember.upsert({
            where: {
                studyTeamId_userId: {
                    studyTeamId: studyTeamId,
                    userId: userId,
                },
            },
            update: {
                summary: summary,
                status: 'PENDING',
                isDeleted: false,
            },
            create: {
                studyTeamId: studyTeamId,
                userId: userId,
                summary: summary,
                status: 'PENDING',
                isLeader: false,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                        mainPosition: true,
                        year: true,
                    },
                },
            },
        });
        this.logger.debug('스터디 팀 지원: 신청 완료');

        return new StudyApplicantResponse(upsertedApplication);
    }

    /** 스터디 보류 상태 지원자 조회 **/
    async getPendingApplicant(
        studyTeamId: number,
        userId: number,
    ): Promise<{ id: number }> {
        const applicant = await this.prisma.studyMember.findUnique({
            where: {
                studyTeamId_userId: {
                    studyTeamId: studyTeamId,
                    userId: userId,
                },
                isDeleted: false,
                status: StudyMemberStatus.PENDING,
            },
            select: {
                id: true,
            },
        });
        if (!applicant) {
            throw new StudyMemberNotFoundException();
        }
        this.logger.debug('스터디 팀 지원자 조회: 조회 완료');

        return applicant;
    }

    /** 스터디 멤버 모든 상태 상세 조회 **/
    async getStudyMemberDetail(
        studyTeamId: number,
        userId: number,
    ): Promise<ApplicantDetailResponse> {
        // 모든 상태의 멤버를 조회한다.
        const applicant = await this.prisma.studyMember.findUnique({
            where: {
                studyTeamId_userId: {
                    studyTeamId: studyTeamId,
                    userId: userId,
                },
            },
            select: {
                id: true,
                status: true,
                isDeleted: true,
            },
        });
        if (!applicant) {
            throw new StudyMemberNotFoundException();
        }
        this.logger.debug('스터디 멤버 모든 상태 상세 조회: 조회 완료');

        return new ApplicantDetailResponse(applicant);
    }

    /** 스터디 멤버 삭제 안 된 멤버 상세 조회 **/
    async getNotDeletedStudyMemberDetailAndEmail(
        studyTeamId: number,
        userId: number,
    ): Promise<ApplicantSummaryResponse> {
        const applicant = await this.prisma.studyMember.findUnique({
            where: {
                studyTeamId_userId: {
                    studyTeamId: studyTeamId,
                    userId: userId,
                },
                isDeleted: false,
            },
            select: {
                id: true,
                status: true,
                isDeleted: true,
                user: {
                    select: {
                        email: true,
                    },
                },
            },
        });
        if (!applicant) {
            throw new StudyMemberNotFoundException();
        }
        this.logger.debug('스터디 멤버 삭제 안 된 멤버 상세 조회: 조회 완료');
        return new ApplicantSummaryResponse(applicant);
    }

    /** 지원자 상태 업데이트 **/
    async updateApplicantStatus(
        studyMemberId: number,
        status: StatusCategory,
    ): Promise<StudyApplicantResponse> {
        const data = await this.prisma.studyMember.update({
            where: {
                id: studyMemberId,
            },
            data: {
                status: status,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                        mainPosition: true,
                        year: true,
                    },
                },
            },
        });
        this.logger.debug('지원자 상태 업데이트: 업데이트 완료');
        return new StudyApplicantResponse(data);
    }

    /** 활동중인 스터디 멤버 조회 **/
    async activeStudyMember(
        id: number,
        isLeader: boolean,
    ): Promise<StudyMemberResponse> {
        const activeStudyMember = await this.prisma.studyMember.update({
            where: { id: id },
            data: {
                isDeleted: false,
                isLeader: isLeader,
                status: 'APPROVED', // 상태도 필요하다면 업데이트
            },
            include: {
                user: {
                    select: {
                        name: true,
                        profileImage: true,
                    },
                },
            },
        });
        this.logger.debug('활동중인 스터디 멤버 조회: 조회 완료');
        return new StudyMemberResponse(activeStudyMember);
    }

    /** 스터디 팀 멤버 신규 생성 **/
    async createStudyMember(
        studyTeamId: number,
        userId: number,
        isLeader: boolean,
    ): Promise<StudyMemberResponse> {
        const newMember = await this.prisma.studyMember.create({
            data: {
                studyTeamId: studyTeamId,
                userId: userId,
                status: 'APPROVED',
                isLeader: isLeader,
                summary: '스터디 팀에 추가된 멤버',
            },
            include: {
                user: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        this.logger.debug('스터디 팀 멤버 신규 생성: 생성 완료');
        return new StudyMemberResponse(newMember);
    }

    /** 스터디 활동 멤버인지 확인 **/
    async isActiveStudyMember(
        studyTeamId: number,
        userId: number,
    ): Promise<boolean> {
        // 거절된 상태, 논리적 삭제된 상태 제외
        const existingMember = await this.prisma.studyMember.findFirst({
            where: {
                studyTeamId: studyTeamId,
                userId: userId,
                isDeleted: false,
                status: 'APPROVED',
            },
            select: {
                id: true,
            },
        });
        this.logger.debug(
            '스터디 멤버인지 확인: 존재하지 않는 스터디 멤버 확인 완료',
        );
        return !!existingMember;
    }
}
