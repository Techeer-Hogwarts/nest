import { Injectable } from '@nestjs/common';
import { CreateSessionRequest } from '../dto/request/create.session.request';
import { SessionEntity } from '../entities/session.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSessionRequest } from '../dto/request/update.session.request';
import { Prisma } from '@prisma/client';
import { GetSessionsQueryRequest } from '../dto/request/get.session.query.request';
import { PaginationQueryDto } from '../../../global/pagination/pagination.query.dto';
import { NotFoundSessionException } from '../../../global/exception/custom.exception';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';
import { IndexService } from '../../../global/index/index.service';
import { IndexSessionRequest } from '../dto/request/index.session.request';

@Injectable()
export class SessionRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: CustomWinstonLogger,
        private readonly indexService: IndexService,
    ) {}

    async findById(sessionId: number): Promise<SessionEntity | null> {
        return this.prisma.session.findUnique({
            where: {
                id: sessionId,
                isDeleted: false,
            },
            include: {
                user: true,
            },
        });
    }

    async createSession(
        userId: number,
        createSessionRequest: CreateSessionRequest,
    ): Promise<SessionEntity> {
        const session: SessionEntity = await this.prisma.session.create({
            data: {
                userId,
                ...createSessionRequest,
            },
            include: { user: true },
        });
        // 인덱스 업데이트
        const indexSession = new IndexSessionRequest(session);
        this.logger.debug(
            `세션 생성 후 인덱스 업데이트 요청 - ${JSON.stringify(indexSession)}`,
            SessionRepository.name,
        );
        await this.indexService.createIndex<IndexSessionRequest>(
            'session',
            indexSession,
        );
        return session;
    }

    async getSession(sessionId: number): Promise<SessionEntity> {
        try {
            const session: SessionEntity = await this.prisma.session.update({
                where: {
                    id: sessionId,
                    isDeleted: false,
                },
                data: {
                    viewCount: { increment: 1 }, // 조회수 증가
                },
                include: {
                    user: true,
                },
            });
            return session;
        } catch (error) {
            this.logger.error(
                `세션 게시물을 찾을 수 없음`,
                SessionRepository.name,
            );
            throw new NotFoundSessionException();
        }
    }

    async getBestSessions(query: PaginationQueryDto): Promise<SessionEntity[]> {
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
        // 2주 계산
        const twoWeeksAgo: Date = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        // SQL 쿼리
        const sessions = await this.prisma.session.findMany({
            where: {
                isDeleted: false,
                createdAt: {
                    gte: twoWeeksAgo,
                },
            },
            include: {
                user: true,
            },
            take: limit,
            skip: offset,
        });

        const sortedSessions = sessions
            .filter((session) => session.viewCount > 0 || session.likeCount > 0) // 조회수 또는 좋아요가 0보다 큰 세션만 필터링
            .sort(
                (a, b) =>
                    b.viewCount +
                    b.likeCount * 10 -
                    (a.viewCount + a.likeCount * 10),
            )
            .slice(offset, limit);

        return sortedSessions;
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
                    ],
                }),
                ...(category && { category }),
                ...(date && date.length > 0 && { date: { in: date } }),
                ...(position &&
                    position.length > 0 && { position: { in: position } }),
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
    ): Promise<any> {
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
        try {
            await this.prisma.session.update({
                where: {
                    id: sessionId,
                    isDeleted: false,
                },
                data: { isDeleted: true },
            });
            this.logger.debug(
                `세션 삭제 후 인덱스 삭제 요청 - sessionId: ${sessionId}`,
                SessionRepository.name,
            );
            await this.indexService.deleteIndex('session', String(sessionId));
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                this.logger.error(
                    `세션 게시물을 찾을 수 없음`,
                    SessionRepository.name,
                );
                throw new NotFoundSessionException();
            }
            throw error;
        }
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

        try {
            const session = await this.prisma.session.update({
                where: {
                    id: sessionId,
                    isDeleted: false,
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
            // 인덱스 업데이트
            const indexSession = new IndexSessionRequest(session);
            this.logger.debug(
                `세션 수정 후 인덱스 업데이트 요청 - ${JSON.stringify(indexSession)}`,
                SessionRepository.name,
            );
            await this.indexService.createIndex<IndexSessionRequest>(
                'session',
                indexSession,
            );
            return session;
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                this.logger.error(
                    `세션 게시물을 찾을 수 없음`,
                    SessionRepository.name,
                );
                throw new NotFoundSessionException();
            }
            throw error;
        }
    }
}
