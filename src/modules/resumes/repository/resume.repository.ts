import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResumeRequest } from '../dto/request/create.resume.request';
import { ResumeEntity } from '../entities/resume.entity';
import { GetResumesQueryRequest } from '../dto/request/get.resumes.query.request';
import { PaginationQueryDto } from '../../../global/pagination/pagination.query.dto';
import { NotFoundResumeException } from '../../../global/exception/custom.exception';
import { Prisma } from '@prisma/client';

@Injectable()
export class ResumeRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createResume(
        createResumeRequest: CreateResumeRequest,
        userId: number,
        prisma: Prisma.TransactionClient = this.prisma, // 기본값으로 this.prisma 사용
    ): Promise<ResumeEntity> {
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

    async getResume(resumeId: number): Promise<any> {
        const resume: any = await this.prisma.resume.findUnique({
            where: {
                id: resumeId,
                isDeleted: false,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        grade: true,
                        year: true,
                        school: true,
                        mainPosition: true,
                        subPosition: true,
                    },
                },
            },
        });

        if (!resume) {
            throw new NotFoundResumeException();
        }
        return resume;
    }

    async getBestResumes(query: PaginationQueryDto): Promise<ResumeEntity[]> {
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
        // 2주 계산
        const twoWeeksAgo: Date = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        // SQL 쿼리
        return this.prisma.$queryRaw<ResumeEntity[]>(Prisma.sql`
            SELECT * FROM "Resume"
            WHERE "isDeleted" = false
                AND "createdAt" >= ${twoWeeksAgo}
            ORDER BY ("viewCount" + "likeCount" * 10) DESC
            LIMIT ${limit} OFFSET ${offset}
        `);
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

        return this.prisma.resume.findMany({
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
    }

    async getResumesByUser(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<any> {
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
        return this.prisma.resume.findMany({
            where: {
                isDeleted: false,
                userId: userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        grade: true,
                        year: true,
                        school: true,
                        mainPosition: true,
                        subPosition: true,
                    },
                },
            },
            skip: offset,
            take: limit,
            orderBy: {
                createdAt: Prisma.SortOrder.desc,
            },
        });
    }

    async deleteResume(resumeId: number): Promise<void> {
        try {
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
                throw new NotFoundResumeException();
            }
            throw error;
        }
    }

    async getResumeTitle(resumeId: number): Promise<string> {
        const resume = await this.prisma.resume.findUnique({
            where: {
                id: resumeId, // 특정 resumeId로 조회
            },
            select: {
                title: true, // 제목만 조회
            },
        });

        if (!resume) {
            throw new NotFoundResumeException();
        }
        return resume.title;
    }

    async updateResume(
        resumeId: number,
        data: { isMain: boolean },
    ): Promise<void> {
        await this.prisma.resume.update({
            where: {
                id: resumeId,
            },
            data,
        });
    }
}
