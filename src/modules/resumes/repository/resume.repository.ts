import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResumeRequest } from '../dto/request/create.resume.request';
import { ResumeEntity } from '../entities/resume.entity';
import { GetResumesQueryRequest } from '../dto/request/get.resumes.query.request';
import { PaginationQueryDto } from '../../../global/pagination/pagination.query.dto';
import { NotFoundResumeException } from '../../../global/exception/custom.exception';
import { Prisma } from '@prisma/client';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';

@Injectable()
export class ResumeRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    async createResume(
        createResumeRequest: CreateResumeRequest,
        userId: number,
        prisma: Prisma.TransactionClient = this.prisma, // 기본값으로 this.prisma 사용
    ): Promise<ResumeEntity> {
        this.logger.debug(`이력서 생성 처리 중`, ResumeRepository.name);
        return prisma.resume.create({
            data: {
                ...createResumeRequest,
                title: createResumeRequest.title,
                user: { connect: { id: userId } },
            },
            include: { user: true },
        });
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
        const resume = await this.prisma.resume.findUnique({
            where: {
                id: resumeId,
                isDeleted: false,
            },
            include: {
                user: true,
            },
        });
        if (!resume) {
            this.logger.error(`이력서를 찾을 수 없음`, ResumeRepository.name);
            throw new NotFoundResumeException();
        }
        this.logger.debug(`이력서 상세 조회 성공`, ResumeRepository.name);
        return resume;
    }

    async getBestResumes(query: PaginationQueryDto): Promise<ResumeEntity[]> {
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
        this.logger.debug(
            `${resumes.length}개의 인기 이력서 목록 조회 성공`,
            ResumeRepository.name,
        );
        return resumes;
    }

    async getResumeList(
        query: GetResumesQueryRequest,
    ): Promise<ResumeEntity[]> {
        const {
            position,
            year,
            offset = 0,
            limit = 10,
        }: GetResumesQueryRequest = query;
        this.logger.debug(
            `이력서 엔티티 목록 조회 - position: ${position}, year: ${year}, offset: ${offset}, limit: ${limit}`,
            ResumeRepository.name,
        );
        const resumes = await this.prisma.resume.findMany({
            where: {
                isDeleted: false,
                ...(position && {
                    user: { mainPosition: position },
                }),
                ...(year && {
                    user: { year: year },
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
            `${resumes.length}개의 인기 이력서 목록 조회 성공`,
            ResumeRepository.name,
        );
        return resumes;
    }

    async getResumesByUser(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<ResumeEntity[]> {
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
        return resumes;
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
        });
        this.logger.debug(`이력서 업데이트 처리 성공`, ResumeRepository.name);
    }
}
