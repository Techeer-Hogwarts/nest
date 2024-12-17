import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudyTeamRequest } from '../dto/request/create.studyTeam.request';
import { StudyTeam, StudyMember, StudyResultImage, StatusCategory } from "@prisma/client";

@Injectable()
export class StudyTeamRepository {
    private readonly logger = new Logger(StudyTeamRepository.name);

    constructor(private readonly prisma: PrismaService) {}

    async createStudyTeam(createStudyTeamRequest: CreateStudyTeamRequest): Promise<any> {
        try {
            this.logger.debug('🔥 [START] createStudyTeam 요청 시작');

            const { studyMember, resultImages, ...teamData } = createStudyTeamRequest;

            const studyTeam = await this.prisma.studyTeam.create({
                data: {
                    ...teamData,
                    studyMember: {
                        create: studyMember.map(member => ({
                            user: { connect: { id: member.userId } },
                            isLeader: member.isLeader,
                            summary: '초기 참여 인원입니다', 
                            status: 'APPROVED',
                        }))
                    },
                    resultImages: {
                        create: resultImages.map(imageUrl => ({ imageUrl }))
                    }
                },
                include: {
                    studyMember: true,
                    resultImages: true
                }
            });

            this.logger.debug('✅ [SUCCESS] Prisma 데이터 저장 성공');
            return studyTeam;
        } catch (error) {
            this.logger.error('❌ [ERROR] createStudyTeam 에서 예외 발생: ', error);
            throw error;
        }
    }


    async checkExistUsers(userIds: number[]): Promise<number[]> {
        try {
            const users = await this.prisma.user.findMany({
                where: { id: { in: userIds } }
            });
    
            // 🔥 존재하는 유저의 ID 목록만 반환
            return users.map(user => user.id);
        } catch (error) {
            this.logger.error('❌ [ERROR] checkExistUsers 에서 예외 발생: ', error);
            throw new Error('데이터베이스 에러가 발생했습니다.');
        }
    }

    
    async findStudyTeamById(id: number): Promise<StudyTeam | null> {
        return this.prisma.studyTeam.findUnique({
            where: { id },
            include: {
                studyMember: true,
                resultImages: true
            }
        });
    }

    // async updateStudyTeam(id: number, updateData: Partial<CreateStudyTeamRequest>): Promise<StudyTeam> {
    //     const { studyMember, resultImages, ...teamData } = updateData;

    //     const studyTeam = await this.prisma.studyTeam.update({
    //         where: { id },
    //         data: {
    //             ...teamData,
    //             studyMember: studyMember ? {
    //                 deleteMany: {},
    //                 create: studyMember.map(member => ({
    //                     userId: member.userId,
    //                     isLeader: member.isLeader
    //                 }))
    //             } : undefined,
    //             resultImages: resultImages ? {
    //                 deleteMany: {},
    //                 create: resultImages.map(imageUrl => ({
    //                     imageUrl
    //                 }))
    //             } : undefined
    //         },
    //         include: {
    //             studyMember: true,
    //             resultImages: true
    //         }
    //     });

    //     return studyTeam;
    // }

    async deleteStudyTeam(id: number): Promise<StudyTeam> {
        return this.prisma.studyTeam.update({
            where: { id },
            data: { isDeleted: true },
        });
    }

    async listAllStudyTeams(): Promise<StudyTeam[]> {
        return this.prisma.studyTeam.findMany({
            where: { isDeleted: false },
            include: {
                studyMember: true,
                resultImages: true
            }
        });
    }

    async addStudyMember(studyTeamId: number, studyMember: StudyMember): Promise<StudyMember> {
        return this.prisma.studyMember.create({
            data: {
                studyTeamId,
                userId: studyMember.userId,
                isLeader: studyMember.isLeader,
                summary: studyMember.summary,
                status: studyMember.status
            }
        });
    }

    async updateStudyMember(id: number, updateData: Partial<StudyMember>): Promise<StudyMember> {
        return this.prisma.studyMember.update({
            where: { id },
            data: updateData
        });
    }

    async deleteStudyMember(id: number): Promise<StudyMember> {
        return this.prisma.studyMember.update({
            where: { id },
            data: { isDeleted: true },
        });
    }

    async addStudyResultImage(studyTeamId: number, imageUrl: string): Promise<StudyResultImage> {
        return this.prisma.studyResultImage.create({
            data: {
                studyTeamId,
                imageUrl
            }
        });
    }

    async deleteStudyResultImage(id: number): Promise<StudyResultImage> {
        return this.prisma.studyResultImage.update({
            where: { id },
            data: { isDeleted: true },
        });
    }
}
