import { Injectable } from '@nestjs/common';

import {
    SessionNotFoundException,
    SessionForbiddenException,
} from './exception/session.exception';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';

import { IndexService } from '../../infra/index/index.service';
import { PrismaService } from '../../infra/prisma/prisma.service';

import { Prisma } from '@prisma/client';
import { Session } from '@prisma/client';

import { PaginationQueryDto } from '../../common/pagination/pagination.query.dto';

import { CreateSessionRequest } from '../../common/dto/sessions/request/create.session.request';
import { UpdateSessionRequest } from '../../common/dto/sessions/request/update.session.request';
import { GetSessionsQueryRequest } from '../../common/dto/sessions/request/get.session.query.request';
import { IndexSessionRequest } from '../../common/dto/sessions/request/index.session.request';

import { CreateSessionResponse } from '../../common/dto/sessions/response/create.session.response';
import { GetSessionResponse } from '../../common/dto/sessions/response/get.session.response';

@Injectable()
export class SessionService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: CustomWinstonLogger,
        private readonly indexService: IndexService,
    ) {}

    async findById(sessionId: number): Promise<Session> {
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
            this.logger.warn(`세션 게시물을 찾을 수 없음`, SessionService.name);
            throw new SessionNotFoundException();
        }

        return session;
    }

    async createSession(
        userId: number,
        createSessionRequest: CreateSessionRequest,
    ): Promise<CreateSessionResponse> {
        this.logger.debug(`세션 게시물 생성 중`, SessionService.name);

        const session = await this.prisma.session.create({
            data: {
                userId,
                ...createSessionRequest,
            },
        });
        // 인덱스 업데이트
        const indexSession = new IndexSessionRequest(session);
        this.logger.debug(
            `세션 생성 후 인덱스 업데이트 요청 - ${JSON.stringify(indexSession)}`,
            SessionService.name,
        );
        await this.indexService.createIndex<IndexSessionRequest>(
            'session',
            indexSession,
        );
        return new CreateSessionResponse(session);
    }

    async getSession(sessionId: number): Promise<GetSessionResponse> {
        this.logger.debug(`단일 세션 게시물 조회 중`, SessionService.name);
        try {
            const session = await this.prisma.session.update({
                where: {
                    id: sessionId,
                },
                data: {
                    viewCount: { increment: 1 }, // 조회수 증가
                },
                include: {
                    user: true,
                },
            });
            // 인덱스 업데이트
            const indexSession = new IndexSessionRequest(session);
            this.logger.debug(
                `조회수 증가 후 인덱스 업데이트 요청`,
                SessionService.name,
            );
            await this.indexService.createIndex('session', indexSession);
            return new GetSessionResponse(session);
        } catch (error) {
            this.logger.error(
                `세션 게시물을 찾을 수 없음: ${error.message}`,
                SessionService.name,
            );
            throw new SessionNotFoundException();
        }
    }

    async getBestSessions(
        query: PaginationQueryDto,
    ): Promise<GetSessionResponse[]> {
        this.logger.debug(`인기 세션 게시물 조회 중`, SessionService.name);
        try {
            const { offset = 0, limit = 10 }: PaginationQueryDto = query;
            // 2주 계산
            const twoWeeksAgo: Date = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

            // SQL 쿼리
            const sessions = await this.prisma.session.findMany({
                where: {
                    createdAt: {
                        gte: twoWeeksAgo,
                    },
                },
                take: limit,
                skip: offset,
                include: {
                    user: true,
                },
            });

            const sortedSessions = sessions
                .filter(
                    (session) => session.viewCount > 0 || session.likeCount > 0,
                )
                .sort(
                    (a, b) =>
                        b.viewCount +
                        b.likeCount * 10 -
                        (a.viewCount + a.likeCount * 10),
                );

            this.logger.debug(
                `인기 세션 게시물 조회 완료 - 조회된 개수: ${sortedSessions.length}`,
                SessionService.name,
            );

            return sortedSessions.map(
                (session) => new GetSessionResponse(session),
            );
        } catch (error) {
            this.logger.error(
                `인기 세션 게시물 조회 중 오류 발생: ${error}`,
                SessionService.name,
            );
            throw error;
        }
    }

    async getSessionList(
        query: GetSessionsQueryRequest,
    ): Promise<GetSessionResponse[]> {
        this.logger.debug(`세션 게시물 목록 조회 중`, SessionService.name);

        const { category, date, position, offset = 0, limit = 10 } = query;

        try {
            const sessions = await this.prisma.session.findMany({
                where: {
                    ...(category && { category }),
                    ...(date && date.length > 0 && { date: { in: date } }),
                    ...(position &&
                        position.length > 0 && { position: { in: position } }),
                },
                skip: offset,
                take: limit,
                orderBy: {
                    title: 'asc',
                },
                include: {
                    user: true,
                },
            });

            this.logger.debug(
                `세션 게시물 목록 조회 완료 - 조회된 개수: ${sessions.length}`,
                SessionService.name,
            );

            return sessions.map((session) => new GetSessionResponse(session));
        } catch (error) {
            this.logger.error(
                `세션 게시물 목록 조회 중 오류 발생: ${error.message}`,
                SessionService.name,
            );
            throw error;
        }
    }

    async getSessionsByUser(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<GetSessionResponse[]> {
        this.logger.debug(`유저 별 세션 게시물 조회 중`, SessionService.name);
        try {
            const { offset = 0, limit = 10 }: PaginationQueryDto = query;
            const sessions = await this.prisma.session.findMany({
                where: {
                    userId: userId,
                },
                skip: offset,
                take: limit,
                include: {
                    user: true,
                },
            });

            this.logger.debug(
                `유저 별 세션 게시물 조회 완료 - 조회된 개수: ${sessions.length}`,
                SessionService.name,
            );

            return sessions.map((session) => new GetSessionResponse(session));
        } catch (error) {
            this.logger.error(
                `유저 별 세션 게시물 조회 중 오류 발생: ${error}`,
                SessionService.name,
            );
            throw error;
        }
    }

    async deleteSession(userId: number, sessionId: number): Promise<void> {
        this.logger.debug(`세션 게시물 삭제 중`, SessionService.name);

        const session = await this.findById(sessionId);

        if (session.userId !== userId) {
            this.logger.error(
                `세션 게시물 삭제 권한 없음`,
                SessionService.name,
            );
            throw new SessionForbiddenException();
        }

        try {
            await this.prisma.$transaction(async (tx) => {
                await tx.session.delete({
                    where: {
                        id: sessionId,
                    },
                });
                this.logger.debug(
                    `세션 삭제 후 인덱스 삭제 요청 - sessionId: ${sessionId}`,
                    SessionService.name,
                );

                await this.indexService.deleteIndex(
                    'session',
                    String(sessionId),
                );
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                this.logger.error(
                    `세션 게시물을 찾을 수 없음`,
                    SessionService.name,
                );
                throw new SessionNotFoundException();
            }
            throw error;
        }
    }

    async updateSession(
        userId: number,
        sessionId: number,
        updateSessionRequest: UpdateSessionRequest,
    ): Promise<CreateSessionResponse> {
        this.logger.debug(`세션 게시물 수정 중`, SessionService.name);

        const session = await this.findById(sessionId);

        if (session.userId !== userId) {
            this.logger.error(
                `세션 게시물 수정 권한 없음`,
                SessionService.name,
            );
            throw new SessionForbiddenException();
        }

        try {
            const updatedSession = await this.prisma.$transaction(async (tx) => {
                    const updated = await tx.session.update({
                        where: {
                            id: sessionId,
                        },
                        data: updateSessionRequest,
                    });
                    // 인덱스 업데이트
                    const indexSession = new IndexSessionRequest(
                        updatedSession,
                    );
                    this.logger.debug(
                        `세션 수정 후 인덱스 업데이트 요청 - ${JSON.stringify(indexSession)}`,
                        SessionService.name,
                    );

                    await this.indexService.createIndex<IndexSessionRequest>(
                        'session',
                        indexSession,
                    );

                    return updated;
                },
            );

            return new CreateSessionResponse(updatedSession);
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                this.logger.error(
                    `세션 게시물을 찾을 수 없음`,
                    SessionService.name,
                );
                throw new SessionNotFoundException();
            }
            throw error;
        }
    }
}
