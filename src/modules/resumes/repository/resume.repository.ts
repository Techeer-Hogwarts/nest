import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResumeRequest } from '../dto/request/create.resume.request';
import { ResumeEntity } from '../entities/resume.entity';
import { GetResumesQueryRequest } from '../dto/request/get.resumes.query.request';
import { PaginationQueryDto } from '../../../global/common/pagination.query.dto';
import { Prisma } from '@prisma/client';
import { UpdateResumeRequest } from '../dto/request/update.resume.request';

@Injectable()
export class ResumeRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createResume(
        createResumeRequest: CreateResumeRequest,
        userId: number,
    ): Promise<ResumeEntity> {
        return this.prisma.resume.create({
            data: {
                ...createResumeRequest,
                user: { connect: { id: userId } }, // user와 연결
            },
            include: { user: true },
        });
    }

    async getResume(resumeId: number): Promise<ResumeEntity> {
        const resume: ResumeEntity = await this.prisma.resume.findUnique({
            where: {
                id: resumeId,
                isDeleted: false,
            },
            include: {
                user: true,
            },
        });

        if (!resume) {
            throw new NotFoundException('이력서를 찾을 수 없습니다.');
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
    ): Promise<ResumeEntity[]> {
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
        return this.prisma.resume.findMany({
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
                throw new NotFoundException('이력서를 찾을 수 없습니다.');
            }
            throw error;
        }
    }

    async updateResume(
        resumeId: number,
        updateResumeRequest: UpdateResumeRequest,
    ): Promise<ResumeEntity> {
        const { title, url, isMain, category }: UpdateResumeRequest =
            updateResumeRequest;

        try {
            return await this.prisma.resume.update({
                where: {
                    id: resumeId,
                    isDeleted: false,
                },
                data: {
                    title,
                    url,
                    isMain,
                    category,
                },
                include: {
                    user: true,
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundException('이력서를 찾을 수 없습니다.');
            }
            throw error;
        }
    }
}
