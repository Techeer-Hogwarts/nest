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
import { SessionService } from './session.service';
import { CreateSessionRequest } from './dto/request/create.session.request';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetSessionResponse } from './dto/response/get.session.response';
import { UpdateSessionRequest } from './dto/request/update.session.request';
import { GetSessionsQueryRequest } from './dto/request/get.session.query.request';
import { PaginationQueryDto } from '../../global/pagination/pagination.query.dto';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { Request } from 'express';
import { CreateSessionResponse } from './dto/response/create.session.response';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';

@ApiTags('sessions')
@Controller('/sessions')
export class SessionController {
    constructor(
        private readonly sessionService: SessionService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({
        summary: '세션 게시물 생성',
        description: '새로운 세션 게시물을 생성합니다.',
    })
    async createSession(
        @Body() createSessionRequest: CreateSessionRequest,
        @Req() request: Request,
    ): Promise<CreateSessionResponse> {
        const user = request.user as any;
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

    @Get('/best')
    @ApiOperation({
        summary: '세션 게시물의 인기글 목록 조회',
        description: '(조회수 + 좋아요수*10)을 기준으로 인기글을 조회합니다.',
    })
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

    @Get()
    @ApiOperation({
        summary: '세션 게시물 목록 조회 및 검색',
        description: '세션 게시물을 조회하고 검색합니다.',
    })
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
    @ApiOperation({
        summary: '단일 세션 게시물 조회',
        description: '지정된 ID의 세션 게시물을 조회합니다.',
    })
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
    @ApiOperation({
        summary: '유저 별 세션 게시물 목록 조회',
        description: '지정된 유저의 세션 게시물 목록을 조회합니다.',
    })
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
    @ApiOperation({
        summary: '세션 게시물 삭제',
        description: '지정된 ID의 세션 게시물을 삭제합니다.',
    })
    async deleteSession(
        @Param('sessionId', ParseIntPipe) sessionId: number,
        @Req() request: Request,
    ): Promise<void> {
        const user = request.user as any;
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
    @ApiOperation({
        summary: '세션 게시물 수정',
        description: '지정된 ID의 세션 게시물을 수정합니다.',
    })
    async updateSession(
        @Param('sessionId', ParseIntPipe) sessionId: number,
        @Body() updateSessionRequest: UpdateSessionRequest,
        @Req() request: Request,
    ): Promise<CreateSessionResponse> {
        const user = request.user as any;
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
