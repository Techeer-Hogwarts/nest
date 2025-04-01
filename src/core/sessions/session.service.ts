import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
    ForbiddenAccessException,
    NotFoundSessionException,
} from '../../common/exception/custom.exception';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { IndexService } from '../../infra/index/index.service';

import { PrismaService } from '../../infra/prisma/prisma.service';

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

    async findById(sessionId: number): Promise<Session | null> {
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
    ): Promise<CreateSessionResponse> {
        this.logger.debug(`세션 게시물 생성 중`, SessionService.name);

        const session = await this.prisma.session.create({
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
                    isDeleted: false,
                },
                data: {
                    viewCount: { increment: 1 }, // 조회수 증가
                },
                include: {
                    user: true,
                },
            });
            // 인덱스 업데이트
            const indexProject = new IndexSessionRequest(session);
            this.logger.debug(
                `조회수 증가 후 인덱스 업데이트 요청`,
                SessionService.name,
            );
            await this.indexService.createIndex('session', indexProject);
            return new GetSessionResponse(session);
        } catch {
            this.logger.error(
                `세션 게시물을 찾을 수 없음`,
                SessionService.name,
            );
            throw new NotFoundSessionException();
        }
    }

    async getBestSessions(
        query: PaginationQueryDto,
    ): Promise<GetSessionResponse[]> {
        this.logger.debug(`인기 세션 게시물 조회 중`, SessionService.name);

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

        return sortedSessions.map((session) => new GetSessionResponse(session));
    }

    async getSessionList(
        query: GetSessionsQueryRequest,
    ): Promise<GetSessionResponse[]> {
        this.logger.debug(`세션 게시물 목록 조회 중`, SessionService.name);

        const { category, date, position, offset = 0, limit = 10 } = query;

        const sessions = await this.prisma.session.findMany({
            where: {
                isDeleted: false,
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
            orderBy: {
                title: 'asc',
            },
        });

        this.logger.debug(
            `세션 게시물 목록 조회 완료 - 조회된 개수: ${sessions.length}`,
            SessionService.name,
        );

        return sessions.map((session) => new GetSessionResponse(session));
    }

    async getSessionsByUser(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<GetSessionResponse[]> {
        this.logger.debug(`유저 별 세션 게시물 조회 중`, SessionService.name);

        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
        const sessions = await this.prisma.session.findMany({
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

        this.logger.debug(
            `유저 별 세션 게시물 조회 완료 - 조회된 개수: ${sessions.length}`,
            SessionService.name,
        );

        return sessions.map((session) => new GetSessionResponse(session));
    }

    async deleteSession(userId: number, sessionId: number): Promise<void> {
        this.logger.debug(`세션 게시물 삭제 중`, SessionService.name);

        const session = await this.findById(sessionId);

        if (session.userId !== userId) {
            this.logger.error(
                `세션 게시물 삭제 권한 없음`,
                SessionService.name,
            );
            throw new ForbiddenAccessException();
        }

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
                SessionService.name,
            );
            await this.indexService.deleteIndex('session', String(sessionId));
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                this.logger.error(
                    `세션 게시물을 찾을 수 없음`,
                    SessionService.name,
                );
                throw new NotFoundSessionException();
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
        if (!session) {
            this.logger.error(
                '세션 게시물을 찾을 수 없음',
                SessionService.name,
            );
            throw new NotFoundSessionException();
        }

        if (session.userId !== userId) {
            this.logger.error(
                `세션 게시물 수정 권한 없음`,
                SessionService.name,
            );
            throw new ForbiddenAccessException();
        }

        try {
            const updatedSession = await this.prisma.session.update({
                where: {
                    id: sessionId,
                    isDeleted: false,
                },
                data: updateSessionRequest,
                include: {
                    user: true,
                },
            });
            // 인덱스 업데이트
            const indexSession = new IndexSessionRequest(updatedSession);
            this.logger.debug(
                `세션 수정 후 인덱스 업데이트 요청 - ${JSON.stringify(indexSession)}`,
                SessionService.name,
            );
            await this.indexService.createIndex<IndexSessionRequest>(
                'session',
                indexSession,
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
                throw new NotFoundSessionException();
            }
            throw error;
        }
    }
}
