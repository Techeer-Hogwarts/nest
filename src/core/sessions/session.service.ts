import { Injectable } from '@nestjs/common';
import { CreateSessionRequest } from '../../common/dto/sessions/request/create.session.request';
import { SessionRepository } from './repository/session.repository';
import { SessionEntity } from './entities/session.entity';
import { GetSessionResponse } from '../../common/dto/sessions/response/get.session.response';
import { UpdateSessionRequest } from '../../common/dto/sessions/request/update.session.request';
import { GetSessionsQueryRequest } from '../../common/dto/sessions/request/get.session.query.request';
import { PaginationQueryDto } from '../../common/pagination/pagination.query.dto';
import { ForbiddenAccessException } from '../../common/exception/custom.exception';
import { CreateSessionResponse } from '../../common/dto/sessions/response/create.session.response';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { IndexService } from '../../infra/index/index.service';
import { IndexSessionRequest } from '../../common/dto/sessions/request/index.session.request';

@Injectable()
export class SessionService {
    constructor(
        private readonly sessionRepository: SessionRepository,
        private readonly logger: CustomWinstonLogger,
        private readonly indexService: IndexService,
    ) {}

    async createSession(
        userId: number,
        createSessionRequest: CreateSessionRequest,
    ): Promise<CreateSessionResponse> {
        this.logger.debug(`세션 게시물 생성 중`, SessionService.name);

        const sessionEntity: SessionEntity =
            await this.sessionRepository.createSession(
                userId,
                createSessionRequest,
            );
        return new CreateSessionResponse(sessionEntity);
    }

    async getSession(sessionId: number): Promise<GetSessionResponse> {
        this.logger.debug(`단일 세션 게시물 조회 중`, SessionService.name);

        const sessionEntity: SessionEntity =
            await this.sessionRepository.getSession(sessionId);

        // 인덱스 업데이트
        const indexProject = new IndexSessionRequest(sessionEntity);
        this.logger.debug(
            `조회수 증가 후 인덱스 업데이트 요청`,
            SessionService.name,
        );
        await this.indexService.createIndex('session', indexProject);
        return new GetSessionResponse(sessionEntity);
    }

    async getBestSessions(
        query: PaginationQueryDto,
    ): Promise<GetSessionResponse[]> {
        this.logger.debug(`인기 세션 게시물 조회 중`, SessionService.name);

        const sessions: SessionEntity[] =
            await this.sessionRepository.getBestSessions(query);
        this.logger.debug(
            `인기 세션 게시물 조회 완료 - 조회된 개수: ${sessions.length}`,
            SessionService.name,
        );
        return sessions.map(
            (session: SessionEntity) => new GetSessionResponse(session),
        );
    }

    async getSessionList(
        query: GetSessionsQueryRequest,
    ): Promise<GetSessionResponse[]> {
        this.logger.debug(`세션 게시물 목록 조회 중`, SessionService.name);

        const sessions: SessionEntity[] =
            await this.sessionRepository.getSessionList(query);
        this.logger.debug(
            `세션 게시물 목록 조회 완료 - 조회된 개수: ${sessions.length}`,
            SessionService.name,
        );
        return sessions.map(
            (session: SessionEntity) => new GetSessionResponse(session),
        );
    }

    async getSessionsByUser(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<GetSessionResponse[]> {
        this.logger.debug(`유저 별 세션 게시물 조회 중`, SessionService.name);

        const sessions: SessionEntity[] =
            await this.sessionRepository.getSessionsByUser(userId, query);
        this.logger.debug(
            `유저 별 세션 게시물 조회 완료 - 조회된 개수: ${sessions.length}`,
            SessionService.name,
        );
        return sessions.map(
            (session: SessionEntity) => new GetSessionResponse(session),
        );
    }

    async deleteSession(userId: number, sessionId: number): Promise<void> {
        this.logger.debug(`세션 게시물 삭제 중`, SessionService.name);

        const session = await this.sessionRepository.findById(sessionId);

        if (session.userId !== userId) {
            this.logger.error(
                `세션 게시물 삭제 권한 없음`,
                SessionService.name,
            );
            throw new ForbiddenAccessException();
        }

        return this.sessionRepository.deleteSession(sessionId);
    }

    async updateSession(
        userId: number,
        sessionId: number,
        updateSessionRequest: UpdateSessionRequest,
    ): Promise<CreateSessionResponse> {
        this.logger.debug(`세션 게시물 수정 중`, SessionService.name);

        const session = await this.sessionRepository.findById(sessionId);

        if (session.userId !== userId) {
            this.logger.error(
                `세션 게시물 수정 권한 없음`,
                SessionService.name,
            );
            throw new ForbiddenAccessException();
        }

        const updatedSession: SessionEntity =
            await this.sessionRepository.updateSession(
                sessionId,
                updateSessionRequest,
            );
        return new CreateSessionResponse(updatedSession);
    }
}
