import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusCategory } from '@prisma/client';
import { CreateStudyMemberRequest } from '../dto/request/create.studyMember.request';
import { Prisma } from '@prisma/client';

@Injectable()
export class StudyMemberRepository {
    private readonly logger = new Logger(StudyMemberRepository.name);

    constructor(private readonly prisma: PrismaService) {}

    async checkExistingMember(
        studyTeamId: number,
        userId: number,
    ): Promise<boolean> {
        const existingMember = await this.prisma.studyMember.findFirst({
            where: {
                studyTeamId,
                userId,
            },
        });
        return !!existingMember; // 사용자가 이미 스터디에 속해 있으면 true 반환
    }

    async isUserAlreadyInStudy(
        studyTeamId: number,
        userId: number,
    ): Promise<boolean> {
        try {
            const existingMember = await this.prisma.studyMember.findFirst({
                where: {
                    studyTeamId: studyTeamId,
                    userId: userId,
                    isDeleted: false, // 삭제되지 않은 멤버만 조회
                },
            });

            const isMember = !!existingMember;
            if (isMember) {
                this.logger.warn(
                    `User (ID: ${userId}) is already a member of Study Team (ID: ${studyTeamId})`,
                );
            }

            return isMember;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] isUserAlreadyInStudy 에서 예외 발생: ',
                error,
            );
            throw new Error(
                '사용자가 스터디에 가입되어 있는지 확인하는 중 오류가 발생했습니다.',
            );
        }
    }

    // 스터디 지원
    async applyToStudyTeam(
        createStudyMemberRequest: CreateStudyMemberRequest,
        userId: number,
    ): Promise<any> {
        try {
            const newApplication = await this.prisma.studyMember.create({
                data: {
                    studyTeamId: createStudyMemberRequest.studyTeamId,
                    userId: userId, // userId는 별도의 매개변수로 전달
                    status: 'PENDING',
                    summary: createStudyMemberRequest.summary,
                    isLeader: false,
                },
            });
            this.logger.debug('✅ [SUCCESS] 스터디 지원 성공');
            return newApplication;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] applyToStudyTeam 에서 예외 발생: ',
                error,
            );
            throw new Error('스터디 지원 중 오류가 발생했습니다.');
        }
    }

    // 스터디 지원 취소
    async cancelApplication(studyTeamId: number, userId: number): Promise<any> {
        try {
            const existingData = await this.prisma.studyMember.findFirst({
                where: {
                    studyTeamId: studyTeamId,
                    userId: userId,
                },
            });

            if (!existingData) {
                throw new Error('존재하지 않는 스터디 신청입니다.');
            }

            const updatedData = await this.prisma.studyMember.update({
                where: {
                    id: existingData.id,
                },
                data: {
                    isDeleted: true,
                },
            });

            this.logger.debug('✅ [INFO] update 실행 결과:', updatedData);

            const checkData = await this.prisma.studyMember.findFirst({
                where: {
                    id: existingData.id,
                },
            });

            this.logger.debug('✅ [INFO] 업데이트 후 데이터: ', checkData);

            return updatedData;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] cancelApplication 에서 예외 발생: ',
                error,
            );

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                throw error;
            }
            throw error;
        }
    }

    // 스터디 지원자 조회
    async getApplicants(studyTeamId: number): Promise<any> {
        try {
            const applicants = await this.prisma.studyMember.findMany({
                where: {
                    studyTeamId: studyTeamId,
                    status: 'PENDING',
                    isDeleted: false,
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            });
            return applicants;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getApplicants 에서 예외 발생: ',
                error,
            );
            throw new Error('스터디 지원자 조회 중 오류가 발생했습니다.');
        }
    }

    // 지원자 상태 업데이트
    async updateApplicantStatus(
        studyTeamId: number,
        userId: number,
        status: StatusCategory,
    ): Promise<any> {
        try {
            const data = await this.prisma.studyMember.update({
                where: {
                    studyTeamId_userId: {
                        studyTeamId: studyTeamId,
                        userId: userId,
                    },
                }, // ✅ 복합 고유 키를 사용한 where 조건
                data: {
                    status: status, // ✅ 변경할 데이터만 지정
                },
            });
            return data;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] updateApplicantStatus 에서 예외 발생: ',
                error,
            );
            throw new Error(
                '스터디 지원자 상태 업데이트 중 오류가 발생했습니다.',
            );
        }
    }

    // 스터디 팀원 추가
    async addMemberToStudyTeam(
        studyTeamId: number,
        memberId: number,
        isLeader: boolean,
    ): Promise<any> {
        try {
            const newMember = await this.prisma.studyMember.create({
                data: {
                    studyTeamId: studyTeamId,
                    userId: memberId,
                    status: 'APPROVED',
                    isLeader: isLeader,
                    summary: '스터디 팀에 추가된 멤버',
                },
            });
            return newMember;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] addMemberToStudyTeam 에서 예외 발생: ',
                error,
            );
            throw new Error('스터디 팀원 추가 중 오류가 발생했습니다.');
        }
    }

    // 사용자가 특정 스터디에 속해있는지 확인
    async isUserMemberOfStudy(
        studyTeamId: number,
        userId: number,
    ): Promise<boolean> {
        try {
            const count = await this.prisma.studyMember.count({
                where: {
                    studyTeamId: studyTeamId,
                    userId: userId,
                    isDeleted: false,
                },
            });
            return count > 0;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] isUserMemberOfStudy 에서 예외 발생: ',
                error,
            );
            throw new Error('스터디 팀 멤버 확인 중 오류가 발생했습니다.');
        }
    }

    async getApplicantStatus(
        studyTeamId: number,
        userId: number,
    ): Promise<string | null> {
        try {
            const member = await this.prisma.studyMember.findFirst({
                where: {
                    studyTeamId,
                    userId,
                    isDeleted: false,
                },
                select: { status: true }, // 🔥 status만 가져옵니다.
            });
            return member ? member.status : null;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getApplicantStatus 에서 예외 발생: ',
                error,
            );
            throw new Error('지원자의 상태를 가져오는 중 오류가 발생했습니다.');
        }
    }
}
