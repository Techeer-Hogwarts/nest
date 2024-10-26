import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSessionRequest } from '../dto/request/create.session.request';
import { SessionEntity } from '../entities/session.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSessionRequest } from '../dto/request/update.session.request';
import { Prisma } from '@prisma/client';
import { GetSessionsQueryRequest } from '../dto/request/get.session.query.request';
import { PaginationQueryDto } from '../../../global/common/pagination.query.dto';

@Injectable()
export class SessionRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createSession(
        createSessionRequest: CreateSessionRequest,
    ): Promise<SessionEntity> {
        return this.prisma.session.create({
            data: { ...createSessionRequest },
            include: { user: true },
        });
    }

    async getSession(sessionId: number): Promise<SessionEntity> {
        const session: SessionEntity = await this.prisma.session.findUnique({
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
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
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

    async getSessionList(
        query: GetSessionsQueryRequest,
    ): Promise<SessionEntity[]> {
        const {
            keyword,
            category,
            date,
            position,
            offset = 0,
            limit = 10,
        }: GetSessionsQueryRequest = query;
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
                        {
                            category: {
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

    async getSessionsByUser(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<SessionEntity[]> {
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
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
        updateSessionRequest: UpdateSessionRequest,
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
        }: UpdateSessionRequest = updateSessionRequest;

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
