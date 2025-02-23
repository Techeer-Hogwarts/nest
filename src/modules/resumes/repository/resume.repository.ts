import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResumeRequest } from '../dto/request/create.resume.request';
import { ResumeEntity } from '../entities/resume.entity';
import { GetResumesQueryRequest } from '../dto/request/get.resumes.query.request';
import { PaginationQueryDto } from '../../../global/pagination/pagination.query.dto';
import { NotFoundResumeException } from '../../../global/exception/custom.exception';
import { Prisma } from '@prisma/client';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';
import { GetResumeResponse } from '../dto/response/get.resume.response';
import { IndexService } from '../../../global/index/index.service';
import { IndexResumeRequest } from '../dto/request/index.resume.request';

@Injectable()
export class ResumeRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: CustomWinstonLogger,
        private readonly indexService: IndexService,
    ) {}

    async createResume(
        createResumeRequest: CreateResumeRequest,
        userId: number,
        prisma: Prisma.TransactionClient = this.prisma, // 기본값으로 this.prisma 사용
    ): Promise<ResumeEntity> {
        this.logger.debug(`이력서 생성 처리 중`, ResumeRepository.name);
        const resume: ResumeEntity = await prisma.resume.create({
            data: {
                ...createResumeRequest,
                title: createResumeRequest.title,
                user: { connect: { id: userId } },
            },
            include: { user: true },
        });

        // 인덱스 업데이트
        const indexResume = new IndexResumeRequest(resume);
        this.logger.debug(
            `이력서 생성 후 인덱스 업데이트 요청 - ${JSON.stringify(indexResume)}`,
            ResumeRepository.name,
        );
        await this.indexService.createIndex<IndexResumeRequest>(
            'resume',
            indexResume,
        );
        return resume;
    }

    async unsetMainResumeForUser(userId: number): Promise<void> {
        await this.prisma.resume.updateMany({
            where: {
                userId: userId,
                isMain: true,
            },
            data: {
                isMain: false,
            },
        });
    }

    async getResume(resumeId: number): Promise<ResumeEntity> {
        this.logger.debug(
            `이력서 상세 조회 - resumeId: ${resumeId}`,
            ResumeRepository.name,
        );
        const resume = await this.prisma.resume
            .update({
                where: {
                    id: resumeId,
                    isDeleted: false,
                },
                data: {
                    viewCount: {
                        increment: 1, // Prisma의 `increment`를 사용하여 viewCount 증가
                    },
                },
                include: {
                    user: true,
                },
            })
            .catch(() => null); // 예외 발생 시 null 반환
        if (!resume) {
            this.logger.error(`이력서를 찾을 수 없음`, ResumeRepository.name);
            throw new NotFoundResumeException();
        }
        this.logger.debug(
            `이력서 상세 조회 및 viewCount 증가 성공`,
            ResumeRepository.name,
        );
        return resume;
    }

    async getBestResumes(
        query: PaginationQueryDto,
    ): Promise<GetResumeResponse[]> {
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
        // 2주 계산
        const twoWeeksAgo: Date = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        // SQL 쿼리
        const resumes = await this.prisma.$queryRaw<ResumeEntity[]>(Prisma.sql`
            SELECT * FROM "Resume"
            WHERE "isDeleted" = false
                AND "createdAt" >= ${twoWeeksAgo}
            ORDER BY ("viewCount" + "likeCount" * 10) DESC
            LIMIT ${limit} OFFSET ${offset}
        `);
        const resumesWithUser = await Promise.all(
            resumes.map(async (resume) => {
                const user = await this.prisma.user.findUnique({
                    where: { id: resume.userId },
                });
                return {
                    ...resume,
                    user,
                };
            }),
        );
        this.logger.debug(
            `${resumesWithUser.length}개의 인기 이력서 목록 조회 성공`,
            ResumeRepository.name,
        );
        return resumesWithUser.map((resume) => new GetResumeResponse(resume));
    }

    async getResumeList(
        query: GetResumesQueryRequest,
    ): Promise<GetResumeResponse[]> {
        const {
            position,
            year,
            category,
            offset = 0,
            limit = 10,
        }: GetResumesQueryRequest = query;
        this.logger.debug(
            `이력서 엔티티 목록 조회 - position: ${position}, year: ${year}, category: ${category}, offset: ${offset}, limit: ${limit}`,
            ResumeRepository.name,
        );
        const resumes = await this.prisma.resume.findMany({
            where: {
                isDeleted: false,
                ...(position?.length && {
                    // user: { mainPosition: { in: position } }, // 유저 포지션
                    position: { in: position },
                }),
                ...(year?.length && {
                    user: { year: { in: year } },
                }),
                ...(category?.length && {
                    category,
                }),
            },
            include: {
                user: true,
            },
            skip: offset,
            take: limit,
            orderBy: {
                createdAt: Prisma.SortOrder.desc,
            },
        });
        this.logger.debug(
            `${resumes.length}개의 이력서 목록 조회 성공`,
            ResumeRepository.name,
        );
        return resumes.map((resume) => new GetResumeResponse(resume));
    }

    async getResumesByUser(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<GetResumeResponse[]> {
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
        this.logger.debug(
            `유저 별 이력서 조회 - userId: ${userId}, offset: ${offset}, limit: ${limit}`,
            ResumeRepository.name,
        );
        const resumes = await this.prisma.resume.findMany({
            where: {
                isDeleted: false,
                userId: userId,
            },
            include: {
                user: true,
            },
            skip: offset,
            take: limit,
            orderBy: {
                createdAt: Prisma.SortOrder.desc,
            },
        });
        this.logger.debug(
            `${resumes.length}개의 유저 별 이력서 목록 조회 성공`,
            ResumeRepository.name,
        );
        return resumes.map((resume) => new GetResumeResponse(resume));
    }

    async deleteResume(resumeId: number): Promise<void> {
        try {
            this.logger.debug(
                `이력서 삭제 - resumeId: ${resumeId}`,
                ResumeRepository.name,
            );
            await this.prisma.resume.update({
                where: {
                    id: resumeId,
                    isDeleted: false,
                },
                data: { isDeleted: true },
            });
            this.logger.debug(
                `이력서 삭제 후 인덱스 삭제 요청 - resumeId: ${resumeId}`,
                ResumeRepository.name,
            );
            await this.indexService.deleteIndex('resume', String(resumeId));
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                this.logger.error(
                    `이력서를 찾을 수 없음`,
                    ResumeRepository.name,
                );
                throw new NotFoundResumeException();
            }
            throw error;
        }
    }

    async getResumeTitle(resumeId: number): Promise<string> {
        this.logger.debug(
            `이력서 제목 조회 - resumeId: ${resumeId}`,
            ResumeRepository.name,
        );
        const resume = await this.prisma.resume.findUnique({
            where: {
                id: resumeId, // 특정 resumeId로 조회
            },
            select: {
                title: true, // 제목만 조회
            },
        });
        if (!resume) {
            this.logger.error(`이력서를 찾을 수 없음`, ResumeRepository.name);
            throw new NotFoundResumeException();
        }
        this.logger.debug(`이력서 제목 조회 성공`, ResumeRepository.name);
        return resume.title;
    }

    async updateResume(
        resumeId: number,
        data: { isMain: boolean },
    ): Promise<void> {
        this.logger.debug(
            `이력서 업데이트 처리 중 - resumeId: ${resumeId}, isMain: ${data.isMain}`,
            ResumeRepository.name,
        );
        await this.prisma.resume.update({
            where: {
                id: resumeId,
            },
            data,
            include: {
                user: true,
            },
        });
        this.logger.debug(`이력서 업데이트 처리 성공`, ResumeRepository.name);
    }
}
