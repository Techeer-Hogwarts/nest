import { Injectable } from '@nestjs/common';
import { CreateSessionRequest } from './dto/request/create.session.request';
import { SessionRepository } from './repository/session.repository';
import { SessionEntity } from './entities/session.entity';
import { GetSessionResponse } from './dto/response/get.session.response';
import { UpdateSessionRequest } from './dto/request/update.session.request';
import { GetSessionsQueryRequest } from './dto/request/get.session.query.request';
import { PaginationQueryDto } from '../../global/common/pagination.query.dto';

@Injectable()
export class SessionService {
    constructor(private readonly sessionRepository: SessionRepository) {}

    async createSession(
        createSessionRequest: CreateSessionRequest,
    ): Promise<GetSessionResponse> {
        const sessionEntity: SessionEntity =
            await this.sessionRepository.createSession(createSessionRequest);
        return new GetSessionResponse(sessionEntity);
    }

    async getSession(sessionId: number): Promise<GetSessionResponse> {
        const sessionEntity: SessionEntity =
            await this.sessionRepository.getSession(sessionId);
        return new GetSessionResponse(sessionEntity);
    }

    async getBestSessions(
        query: PaginationQueryDto,
    ): Promise<GetSessionResponse[]> {
        const sessions: SessionEntity[] =
            await this.sessionRepository.getBestSessions(query);
        return sessions.map(
            (session: SessionEntity) => new GetSessionResponse(session),
        );
    }

    async getSessionList(
        query: GetSessionsQueryRequest,
    ): Promise<GetSessionResponse[]> {
        const sessions: SessionEntity[] =
            await this.sessionRepository.getSessionList(query);
        return sessions.map(
            (session: SessionEntity) => new GetSessionResponse(session),
        );
    }

    async getSessionsByUser(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<GetSessionResponse[]> {
        const sessions: SessionEntity[] =
            await this.sessionRepository.getSessionsByUser(userId, query);
        return sessions.map(
            (session: SessionEntity) => new GetSessionResponse(session),
        );
    }

    async deleteSession(sessionId: number): Promise<void> {
        await this.sessionRepository.getSession(sessionId);
        return this.sessionRepository.deleteSession(sessionId);
    }

    async updateSession(
        sessionId: number,
        updateSessionRequest: UpdateSessionRequest,
    ): Promise<GetSessionResponse> {
        await this.sessionRepository.getSession(sessionId);
        const session: SessionEntity =
            await this.sessionRepository.updateSession(
                sessionId,
                updateSessionRequest,
            );
        return new GetSessionResponse(session);
    }
}
