import { Injectable } from '@nestjs/common';
import { CreateSessionDto } from './dto/request/create.session.request';
import { SessionRepository } from './repository/session.repository';
import { SessionEntity } from './entities/session.entity';
import { GetSessionDto } from './dto/response/get.session.response';
import { UpdateSessionDto } from './dto/request/update.session.request';
import { PaginationQueryDto } from './dto/request/pagination.query.request';
import { GetSessionsQueryDto } from './dto/request/get.session.query.request';

@Injectable()
export class SessionService {
    constructor(private readonly sessionRepository: SessionRepository) {}

    async createSession(
        createSessionDto: CreateSessionDto,
    ): Promise<GetSessionDto> {
        const sessionEntity: SessionEntity =
            await this.sessionRepository.createSession(createSessionDto);
        return new GetSessionDto(sessionEntity);
    }

    async getSession(sessionId: number): Promise<GetSessionDto> {
        const sessionEntity: SessionEntity =
            await this.sessionRepository.getSession(sessionId);
        return new GetSessionDto(sessionEntity);
    }

    async getBestSessions(query: PaginationQueryDto): Promise<GetSessionDto[]> {
        const sessions = await this.sessionRepository.getBestSessions(query);
        return sessions.map((session) => new GetSessionDto(session));
    }

    async getSessionList(query: GetSessionsQueryDto): Promise<GetSessionDto[]> {
        const sessions = await this.sessionRepository.getSessionList(query);
        return sessions.map((session) => new GetSessionDto(session));
    }

    async getSessionsByUserId(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<GetSessionDto[]> {
        const sessions = await this.sessionRepository.getSessionsByUserId(
            userId,
            query,
        );
        return sessions.map((session) => new GetSessionDto(session));
    }

    async deleteSession(sessionId: number): Promise<void> {
        await this.sessionRepository.getSession(sessionId);
        return this.sessionRepository.deleteSession(sessionId);
    }

    async updateSession(
        sessionId: number,
        updateSessionDto: UpdateSessionDto,
    ): Promise<GetSessionDto> {
        await this.sessionRepository.getSession(sessionId);
        const session = await this.sessionRepository.updateSession(
            sessionId,
            updateSessionDto,
        );
        return new GetSessionDto(session);
    }
}
