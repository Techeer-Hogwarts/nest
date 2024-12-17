import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from '../../prisma/prisma.service';
import { StatusCategory } from "@prisma/client";
import { CreateStudyMemberRequest } from "../dto/create.studyMember.request";

@Injectable()
export class StudyMemberRepository {
    private readonly logger = new Logger(StudyMemberRepository.name);

    constructor(private readonly prisma: PrismaService) {}

    // 스터디 지원
    async applyToStudyTeam(createStudyMemberRequest: CreateStudyMemberRequest): Promise<any> {
        try {
            const newApplication = await this.prisma.studyMember.create({
                data: {
                    studyTeamId: createStudyMemberRequest.studyTeamId,
                    userId: createStudyMemberRequest.userId,
                    status: 'PENDING',
                    summary: createStudyMemberRequest.summary,
                    isLeader: false
                }
            });
            this.logger.debug('✅ [SUCCESS] 스터디 지원 성공');
            return newApplication;
        } catch (error) {
            this.logger.error('❌ [ERROR] applyToStudyTeam 에서 예외 발생: ', error);
            throw new Error('스터디 지원 중 오류가 발생했습니다.');
        }
    }

    // 스터디 지원 취소
    async cancelApplication(studyMemberId: number, userId: number): Promise<any> {
        try {
            const data = await this.prisma.studyMember.updateMany({
                where: { id: studyMemberId, userId: userId },
                data: { isDeleted: true }
            });
            return data;
        } catch (error) {
            this.logger.error('❌ [ERROR] cancelApplication 에서 예외 발생: ', error);
            throw new Error('스터디 지원 취소 중 오류가 발생했습니다.');
        }
    }

    // 스터디 지원자 조회
    async getApplicants(studyTeamId: number): Promise<any> {
        try {
            const applicants = await this.prisma.studyMember.findMany({
                where: {
                    studyTeamId: studyTeamId,
                    status: 'PENDING',
                    isDeleted: false
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            });
            return applicants;
        } catch (error) {
            this.logger.error('❌ [ERROR] getApplicants 에서 예외 발생: ', error);
            throw new Error('스터디 지원자 조회 중 오류가 발생했습니다.');
        }
    }

    // 지원자 상태 업데이트
    async updateApplicantStatus(studyMemberId: number, status: StatusCategory): Promise<any> {
        try {
            const data = await this.prisma.studyMember.update({
                where: { id: studyMemberId },
                data: { status }
            });
            return data;
        } catch (error) {
            this.logger.error('❌ [ERROR] updateApplicantStatus 에서 예외 발생: ', error);
            throw new Error('스터디 지원자 상태 업데이트 중 오류가 발생했습니다.');
        }
    }

    // 스터디 팀원 추가
    async addMemberToStudyTeam(studyTeamId: number, userId: number): Promise<any> {
        try {
            const newMember = await this.prisma.studyMember.create({
                data: {
                    studyTeamId: studyTeamId,
                    userId: userId,
                    status: 'APPROVED',
                    isLeader: false,
                    summary: '스터디 팀에 추가된 멤버'
                }
            });
            return newMember;
        } catch (error) {
            this.logger.error('❌ [ERROR] addMemberToStudyTeam 에서 예외 발생: ', error);
            throw new Error('스터디 팀원 추가 중 오류가 발생했습니다.');
        }
    }

    // 사용자가 특정 스터디에 속해있는지 확인
    async isUserMemberOfStudy(studyTeamId: number, userId: number): Promise<boolean> {
        try {
            const count = await this.prisma.studyMember.count({
                where: {
                    studyTeamId: studyTeamId,
                    userId: userId,
                    isDeleted: false
                }
            });
            return count > 0;
        } catch (error) {
            this.logger.error('❌ [ERROR] isUserMemberOfStudy 에서 예외 발생: ', error);
            throw new Error('스터디 팀 멤버 확인 중 오류가 발생했습니다.');
        }
    }
}
