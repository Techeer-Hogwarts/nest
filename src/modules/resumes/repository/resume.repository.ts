import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResumeRequest } from '../dto/request/create.resume.request';
import { ResumeEntity } from '../entities/resume.entity';
import { GetResumesQueryRequest } from '../dto/request/get.resumes.query.request';
import { PaginationQueryDto } from '../../../global/common/pagination.query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ResumeRepository {
    constructor(private readonly prisma: PrismaService) {}

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

    // 이력서 생성 로직
    async createResume(
        createResumeRequest: CreateResumeRequest,
        userId: number,
    ): Promise<ResumeEntity> {
        return this.prisma.resume.create({
            data: {
                ...createResumeRequest,
                user: { connect: { id: userId } }, // user와 연결
            },
            include: { user: true }, // user 관계를 포함하여 반환
        });
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
        });
    }

    async getResume(resumeId: number): Promise<ResumeEntity> {
        return this.prisma.resume.findUnique({
            where: {
                id: resumeId,
                isDeleted: false,
            },
            include: {
                user: true,
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
        });
    }
}
