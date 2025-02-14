import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudyTeamRequest } from '../dto/request/create.studyTeam.request';
import { StatusCategory } from '@prisma/client';
import { UpdateStudyTeamRequest } from '../dto/request/update.studyTeam.request';
import {
    GetStudyTeamResponse,
    StudyMemberResponse,
} from '../dto/response/get.studyTeam.response';

@Injectable()
export class StudyTeamRepository {
    private readonly logger = new Logger(StudyTeamRepository.name);

    constructor(private readonly prisma: PrismaService) {}

    async findStudyByName(name: string): Promise<boolean> {
        try {
            this.logger.debug(`🔍 [INFO] 스터디 이름 중복 확인 중: ${name}`);

            const existingStudy = await this.prisma.studyTeam.findUnique({
                where: { name },
            });

            if (existingStudy) {
                this.logger.debug(
                    `⚠️ [WARNING] 중복된 스터디 이름이 발견되었습니다: ${name}`,
                );
                return true;
            }

            this.logger.debug(
                `✅ [SUCCESS] 중복된 스터디 이름이 없습니다: ${name}`,
            );
            return false;
        } catch (error) {
            this.logger.error(
                `❌ [ERROR] checkIfStudyNameExists 중 예외 발생: ${name}`,
                error,
            );
            throw new Error('스터디 이름 중복 확인 중 오류가 발생했습니다.');
        }
    }

    async createStudyTeam(
        createStudyTeamRequest: CreateStudyTeamRequest,
    ): Promise<GetStudyTeamResponse> {
        try {
            this.logger.debug('🔥 [START] createStudyTeam 요청 시작');

            const { studyMember, resultImages, ...teamData } =
                createStudyTeamRequest;

            const study = await this.prisma.studyTeam.create({
                data: {
                    ...teamData,
                    studyMember: {
                        create: studyMember.map((member) => ({
                            user: { connect: { id: member.userId } },
                            isLeader: member.isLeader,
                            summary: '초기 참여 인원입니다',
                            status: 'APPROVED' as StatusCategory,
                        })),
                    },
                    resultImages: {
                        create: resultImages.map((imageUrl) => ({ imageUrl })),
                    },
                },
                include: {
                    studyMember: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                    resultImages: true,
                },
            });

            return new GetStudyTeamResponse(study);
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] createStudyTeam 에서 예외 발생: ',
                error,
            );
            throw error;
        }
    }

    async checkExistUsers(userIds: number[]): Promise<number[]> {
        try {
            const users = await this.prisma.user.findMany({
                where: { id: { in: userIds } },
            });

            // 🔥 존재하는 유저의 ID 목록만 반환
            return users.map((user) => user.id);
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] checkExistUsers 에서 예외 발생: ',
                error,
            );
            throw new Error('데이터베이스 에러가 발생했습니다.');
        }
    }

    async deleteImages(imageIds: number[]): Promise<void> {
        await this.prisma.studyResultImage.updateMany({
            where: { id: { in: imageIds } },
            data: { isDeleted: true }, // soft delete
        });
    }

    async deleteMembers(memberIds: number[]): Promise<void> {
        await this.prisma.studyMember.updateMany({
            where: { id: { in: memberIds } },
            data: { isDeleted: true }, // soft delete
        });
    }

    async updateStudyTeam(
        id: number,
        updateData: Partial<UpdateStudyTeamRequest>,
        imageUrls: string[] = [], // 기본값 추가
        studyMembers: { userId: number; isLeader: boolean }[] = [], // 기본값 추가
    ): Promise<GetStudyTeamResponse> {
        try {
            // ✅ studyMembers가 존재할 때만 map()을 실행
            const userIds =
                Array.isArray(studyMembers) && studyMembers.length > 0
                    ? studyMembers.map((member) => member.userId)
                    : [];

            const existingStudyMembers =
                (await this.prisma.studyMember.findMany({
                    where: {
                        studyTeamId: id,
                        userId: { in: userIds },
                    },
                    select: {
                        id: true,
                        userId: true,
                    },
                })) || [];

            const studyMemberIdMap = Array.isArray(existingStudyMembers)
                ? existingStudyMembers.reduce((acc, member) => {
                      acc[member.userId] = member.id;
                      return acc;
                  }, {})
                : {};

            const upsertMembers =
                Array.isArray(studyMembers) && studyMembers.length > 0
                    ? studyMembers.map((member) => {
                          const existingId = studyMemberIdMap[member.userId];
                          return {
                              where: { id: existingId || 0 },
                              create: {
                                  user: { connect: { id: member.userId } },
                                  isLeader: member.isLeader,
                                  summary: '초기 승인된 멤버입니다.',
                                  status: 'APPROVED' as StatusCategory,
                              },
                              update: {
                                  isLeader: member.isLeader,
                              },
                          };
                      })
                    : []; // studyMembers가 없으면 빈 배열

            const updatedStudyTeam = await this.prisma.studyTeam.update({
                where: { id },
                data: {
                    ...updateData,
                    resultImages:
                        imageUrls.length > 0
                            ? {
                                  create: imageUrls.map((url) => ({
                                      imageUrl: url,
                                  })),
                              }
                            : undefined,
                    studyMember:
                        upsertMembers.length > 0
                            ? { upsert: upsertMembers }
                            : undefined,
                },
                include: {
                    resultImages: true,
                    studyMember: {
                        include: {
                            user: {
                                select: { name: true },
                            },
                        },
                    },
                },
            });

            this.logger.debug('✅ [SUCCESS] 스터디 팀 데이터 업데이트 성공');
            return new GetStudyTeamResponse(updatedStudyTeam);
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] updateStudyTeam 에서 예외 발생: ',
                error,
            );
            throw new Error('데이터베이스 에러가 발생했습니다.');
        }
    }

    async closeStudyTeam(id: number): Promise<GetStudyTeamResponse> {
        try {
            const updatedStudyTeam = await this.prisma.studyTeam.update({
                where: { id },
                data: { isRecruited: false }, // isRecruited를 false로 설정
                include: {
                    resultImages: true,
                    studyMember: {
                        include: {
                            user: {
                                select: { name: true },
                            },
                        },
                    },
                },
            });
            this.logger.debug('✅ [SUCCESS] 스터디 팀 모집 마감 성공');

            return new GetStudyTeamResponse(updatedStudyTeam);
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] closeStudyTeam 에서 예외 발생: ',
                error,
            );
            throw new Error('데이터베이스 에러가 발생했습니다.');
        }
    }

    async deleteStudyTeam(id: number): Promise<GetStudyTeamResponse> {
        try {
            const updatedStudyTeam = await this.prisma.studyTeam.update({
                where: { id },
                data: { isDeleted: true }, // isDeleted를 true로 설정
                include: {
                    resultImages: true,
                    studyMember: {
                        include: {
                            user: {
                                select: { name: true },
                            },
                        },
                    },
                },
            });
            this.logger.debug('✅ [SUCCESS] 스터디 팀 삭제 성공');
            return new GetStudyTeamResponse(updatedStudyTeam);
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] deleteStudyTeam 에서 예외 발생: ',
                error,
            );
            throw new Error('데이터베이스 에러가 발생했습니다.');
        }
    }

    async getUserStudyTeams(userId: number): Promise<GetStudyTeamResponse[]> {
        try {
            const userStudyTeams = await this.prisma.studyTeam.findMany({
                where: {
                    isDeleted: false,
                    studyMember: {
                        some: {
                            userId: userId,
                            isDeleted: false,
                        },
                    },
                },
                include: {
                    resultImages: {
                        where: { isDeleted: false },
                    },
                    studyMember: {
                        where: {
                            isDeleted: false,
                            status: 'APPROVED',
                        },
                        include: {
                            user: {
                                select: { name: true },
                            },
                        },
                    },
                },
            });

            return userStudyTeams.map(
                (study) => new GetStudyTeamResponse(study),
            );
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getUserStudyTeams 에서 예외 발생: ',
                error,
            );
            throw new Error('데이터베이스 에러가 발생했습니다.');
        }
    }

    // 스터디 아이디로 스터디 상세 조회 (토큰 검사 X)
    async getStudyTeamById(id: number): Promise<GetStudyTeamResponse> {
        try {
            const studyTeam = await this.prisma.studyTeam.findUnique({
                where: {
                    id: id,
                    isDeleted: false,
                },
                include: {
                    resultImages: {
                        where: { isDeleted: false },
                    },
                    studyMember: {
                        where: {
                            isDeleted: false,
                            status: 'APPROVED',
                        },
                        include: {
                            user: {
                                select: { name: true },
                            },
                        },
                    },
                },
            });

            if (!studyTeam) {
                this.logger.warn(`Study Team with ID ${id} not found.`);
                throw new Error('해당 ID의 스터디 팀을 찾을 수 없습니다.');
            }

            return new GetStudyTeamResponse(studyTeam);
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getStudyTeamById 에서 예외 발생: ',
                error,
            );
            throw new Error('데이터베이스 에러가 발생했습니다.');
        }
    }

    async getStudyTeamMembersById(id: number): Promise<StudyMemberResponse[]> {
        try {
            const studyTeam = await this.prisma.studyTeam.findUnique({
                where: {
                    id: id,
                    isDeleted: false,
                },
                include: {
                    studyMember: {
                        where: { isDeleted: false },
                        include: {
                            user: true, // Include user to get name
                        },
                    },
                },
            });

            if (!studyTeam) {
                return null;
            }

            const members = studyTeam.studyMember.map(
                (member) => new StudyMemberResponse(member),
            );

            this.logger.debug('✅ [SUCCESS] 스터디의 모든 인원 조회 성공');
            return members;
        } catch (error) {
            this.logger.error(
                '❌ [ERROR] getStudyTeamMembersById 에서 예외 발생: ',
                error,
            );
            throw new Error('데이터베이스 에러가 발생했습니다.');
        }
    }

    async isUserMemberOfStudy(
        studyId: number,
        userId: number,
    ): Promise<boolean> {
        try {
            const exists = await this.prisma.studyMember.findFirst({
                where: {
                    studyTeamId: studyId,
                    userId: userId,
                    isDeleted: false,
                },
                select: { id: true }, // 최소한의 데이터만 조회
            });
            this.logger.debug(
                `🔍 [INFO] isUserMemberOfStudy: Study (ID: ${studyId}), User (ID: ${userId}) → Result: ${exists !== null}`,
            );
            return exists !== null;
        } catch (error) {
            this.logger.error(
                `❌ [ERROR] isUserMemberOfStudy failed for Study (ID: ${studyId}), User (ID: ${userId})`,
                error,
            );
            throw error;
        }
    }

    async getAllActiveStudyTeams(): Promise<GetStudyTeamResponse[]> {
        const studyTeams = await this.prisma.studyTeam.findMany({
            where: { isDeleted: false },
            include: {
                resultImages: true,
                studyMember: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return studyTeams.map(
            (studyTeam) => new GetStudyTeamResponse(studyTeam),
        );
    }
}
