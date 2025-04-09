import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { PaginationQueryDto } from '../../common/pagination/pagination.query.dto';
import { JwtAuthGuard } from '../../core/auth/jwt.guard';

import { SessionService } from '../../core/sessions/session.service';

import { CreateSessionRequest } from '../../common/dto/sessions/request/create.session.request';
import { UpdateSessionRequest } from '../../common/dto/sessions/request/update.session.request';
import { GetSessionsQueryRequest } from '../../common/dto/sessions/request/get.session.query.request';

import { CreateSessionResponse } from '../../common/dto/sessions/response/create.session.response';
import { GetSessionResponse } from '../../common/dto/sessions/response/get.session.response';

import {
    PostSessionDocs,
    GetBestSessionsDocs,
    GetSessionListDocs,
    GetSessionDocs,
    GetSessionsByUserDocs,
    DeleteSessionDocs,
    UpdateSessionDocs,
    SessionControllerDocs,
} from './session.docs';

@SessionControllerDocs()
@Controller('/sessions')
export class SessionController {
    constructor(
        private readonly sessionService: SessionService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    @PostSessionDocs()
    async createSession(
        @Body() createSessionRequest: CreateSessionRequest,
        @Req() request: Request,
    ): Promise<CreateSessionResponse> {
        const user = request.user as { id: number };
        this.logger.debug(
            `세션 게시물 생성 요청 처리 중 - userId: ${user.id}`,
            SessionController.name,
        );

        const result = await this.sessionService.createSession(
            user.id,
            createSessionRequest,
        );
        this.logger.debug(
            `세션 게시물 생성 요청 처리 완료`,
            SessionController.name,
        );
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Get('/best')
    @GetBestSessionsDocs()
    async getBestSessions(
        @Query() query: PaginationQueryDto,
    ): Promise<GetSessionResponse[]> {
        this.logger.debug(
            `세션 인기글 목록 조회 처리 중 - query: ${JSON.stringify(query)}`,
            SessionController.name,
        );

        const result = await this.sessionService.getBestSessions(query);
        this.logger.debug(
            `세션 인기글 목록 조회 처리 완료`,
            SessionController.name,
        );
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    @GetSessionListDocs()
    async getSessionList(
        @Query() query: GetSessionsQueryRequest,
    ): Promise<GetSessionResponse[]> {
        this.logger.debug(
            `세션 목록 조회 및 검색 처리 중 - query: ${JSON.stringify(query)}`,
            SessionController.name,
        );

        const result = await this.sessionService.getSessionList(query);
        this.logger.debug(
            `세션 목록 조회 및 검색 처리 완료`,
            SessionController.name,
        );
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Get(':sessionId')
    @GetSessionDocs()
    async getSession(
        @Param('sessionId', ParseIntPipe) sessionId: number,
    ): Promise<GetSessionResponse> {
        this.logger.debug(
            `단일 세션 게시물 조회 처리 중 - sessionId: ${sessionId}`,
            SessionController.name,
        );

        const result = await this.sessionService.getSession(sessionId);
        this.logger.debug(
            `단일 세션 게시물 목록 조회 처리 완료`,
            SessionController.name,
        );
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Get('/user/:userId')
    @GetSessionsByUserDocs()
    async getSessionsByUser(
        @Param('userId', ParseIntPipe) userId: number,
        @Query() query: PaginationQueryDto,
    ): Promise<GetSessionResponse[]> {
        this.logger.debug(
            `유저 별 세션 게시물 목록 조회 처리 중 - userId: ${userId}, query: ${JSON.stringify(query)}`,
            SessionController.name,
        );

        const result = await this.sessionService.getSessionsByUser(
            userId,
            query,
        );
        this.logger.debug(
            `유저 별 세션 게시물 목록 조회 처리 완료`,
            SessionController.name,
        );
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':sessionId')
    @DeleteSessionDocs()
    async deleteSession(
        @Param('sessionId', ParseIntPipe) sessionId: number,
        @Req() request: Request,
    ): Promise<void> {
        const user = request.user as { id: number };
        this.logger.debug(
            `세션 게시물 삭제 요청 처리 중 - userId: ${user.id}, sessionId: ${sessionId}`,
            SessionController.name,
        );

        await this.sessionService.deleteSession(user.id, sessionId);
        this.logger.debug(
            `세션 게시물 삭제 요청 처리 완료`,
            SessionController.name,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':sessionId')
    @UpdateSessionDocs()
    async updateSession(
        @Param('sessionId', ParseIntPipe) sessionId: number,
        @Body() updateSessionRequest: UpdateSessionRequest,
        @Req() request: Request,
    ): Promise<CreateSessionResponse> {
        const user = request.user as { id: number };
        this.logger.debug(
            `세션 게시물 수정 요청 처리 중 - userId: ${user.id}, sessionId: ${sessionId}`,
            SessionController.name,
        );

        const result = await this.sessionService.updateSession(
            user.id,
            sessionId,
            updateSessionRequest,
        );
        this.logger.debug(
            `세션 게시물 수정 요청 처리 완료`,
            SessionController.name,
        );
        return result;
    }
}
