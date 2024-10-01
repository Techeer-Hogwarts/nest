import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSessionDto } from '../dto/request/create.session.dto';
import { SessionEntity } from '../entities/session.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSessionDto } from '../dto/request/update.session.dto';
import { PaginationQueryDto } from '../dto/request/pagination.query.dto';
import { Prisma } from '@prisma/client';
import { GetSessionsQueryDto } from '../dto/request/get.session.query.dto';

@Injectable()
export class SessionRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createSession(
        createSessionDto: CreateSessionDto,
    ): Promise<SessionEntity> {
        return this.prisma.session.create({
            data: { ...createSessionDto },
            include: { user: true },
        });
    }

    async getSession(sessionId: number): Promise<SessionEntity> {
        const session = await this.prisma.session.findUnique({
            where: {
                id: sessionId,
                isDeleted: false,
            },
            include: {
                user: true,
            },
        });

        if (!session) {
            throw new NotFoundException('게시물을 찾을 수 없습니다.');
        }
        return session;
    }

    async getBestSessions(query: PaginationQueryDto): Promise<SessionEntity[]> {
        const { offset = 0, limit = 10 } = query;
        // 2주 계산
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        // SQL 쿼리
        return this.prisma.$queryRaw<SessionEntity[]>(Prisma.sql`
            SELECT * FROM "Session"
            WHERE "isDeleted" = false
                AND "createdAt" >= ${twoWeeksAgo}
            ORDER BY ("viewCount" + "likeCount" * 10) DESC
            LIMIT ${limit} OFFSET ${offset}
        `);
    }

    async getSessionList(query: GetSessionsQueryDto): Promise<SessionEntity[]> {
        const {
            keyword,
            category,
            date,
            position,
            offset = 0,
            limit = 10,
        } = query;
        return this.prisma.session.findMany({
            where: {
                isDeleted: false,
                ...(keyword && {
                    OR: [
                        {
                            title: {
                                contains: keyword,
                                mode: 'insensitive',
                            },
                        },
                    ],
                }),
                ...(category && { category }),
                ...(date && { date }),
                ...(position && { position }),
            },
            include: {
                user: true,
            },
            skip: offset,
            take: limit,
        });
    }

    async getSessionsByUserId(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<SessionEntity[]> {
        const { offset = 0, limit = 10 } = query;
        return this.prisma.session.findMany({
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

    async deleteSession(sessionId: number): Promise<void> {
        await this.prisma.session.update({
            where: { id: sessionId },
            data: { isDeleted: true },
        });
    }

    async updateSession(
        sessionId: number,
        updateSessionDto: UpdateSessionDto,
    ): Promise<SessionEntity> {
        const {
            thumbnail,
            title,
            presenter,
            date,
            position,
            category,
            videoUrl,
            fileUrl,
        } = updateSessionDto;

        return this.prisma.session.update({
            where: {
                id: sessionId,
            },
            data: {
                thumbnail,
                title,
                presenter,
                date,
                position,
                category,
                videoUrl,
                fileUrl,
            },
            include: {
                user: true,
            },
        });
    }
}
