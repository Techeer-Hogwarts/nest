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
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { JwtAuthGuard } from '../../core/auth/jwt.guard';

import { EventService } from '../../core/events/event.service';

import { CreateEventRequest } from '../../common/dto/events/request/create.event.request';
import { GetEventListQueryRequest } from '../../common/dto/events/request/get.event.query.request';

import { CreateEventResponse } from '../../common/dto/events/response/creare.event.response';
import { GetEventResponse } from '../../common/dto/events/response/get.event.response';

@ApiTags('events')
@Controller('/events')
export class EventController {
    constructor(
        private readonly eventService: EventService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({
        summary: '이벤트 생성',
        description: '새로운 이벤트를 생성합니다.',
    })
    async createEvent(
        @Body() createEventRequest: CreateEventRequest,
        @Req() request: Request,
    ): Promise<CreateEventResponse> {
        const user = request.user as { id: number };
        this.logger.debug(
            `이벤트 생성 요청 처리 중 - userId: ${user.id}`,
            EventController.name,
        );

        const result = await this.eventService.createEvent(
            user.id,
            createEventRequest,
        );
        this.logger.debug(`이벤트 생성 요청 처리 완료`, EventController.name);
        return result;
    }

    @Get()
    @ApiOperation({
        summary: '이벤트 목록 조회 및 검색',
        description: '이벤트 목록을 조회하고 검색합니다.',
    })
    async getEventList(
        @Query() query: GetEventListQueryRequest,
    ): Promise<GetEventResponse[]> {
        this.logger.debug(
            `이벤트 목록 조회 및 검색 처리 중 - query: ${JSON.stringify(query)}`,
            EventController.name,
        );

        const result = await this.eventService.getEventList(query);
        this.logger.debug(
            `이벤트 목록 조회 및 검색 처리 완료`,
            EventController.name,
        );
        return result;
    }

    @Get(':eventId')
    @ApiOperation({
        summary: '단일 이벤트 조회',
        description: '지정된 ID의 이벤트를 조회합니다.',
    })
    async getEvent(
        @Param('eventId', ParseIntPipe) eventId: number,
    ): Promise<GetEventResponse> {
        this.logger.debug(
            `단일 이벤트 조회 처리 중 - eventId: ${eventId}`,
            EventController.name,
        );

        const result = await this.eventService.getEvent(eventId);
        this.logger.debug(
            `단일 이벤트 목록 조회 처리 완료`,
            EventController.name,
        );
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':eventId')
    @ApiOperation({
        summary: '이벤트 수정',
        description: '지정된 ID의 이벤트를 수정합니다.',
    })
    async updateEvent(
        @Param('eventId', ParseIntPipe) eventId: number,
        @Body() updateEventRequest: CreateEventRequest,
        @Req() request: Request,
    ): Promise<CreateEventResponse> {
        const user = request.user as { id: number };
        this.logger.debug(
            `이벤트 수정 요청 처리 중 - userId: ${user.id}, eventId: ${eventId}`,
            EventController.name,
        );

        const result = await this.eventService.updateEvent(
            user.id,
            eventId,
            updateEventRequest,
        );
        this.logger.debug(`이벤트 수정 요청 처리 완료`, EventController.name);
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':eventId')
    @ApiOperation({
        summary: '이벤트 삭제',
        description: '지정된 ID의 이벤트를 삭제합니다.',
    })
    async deleteEvent(
        @Param('eventId', ParseIntPipe) eventId: number,
        @Req() request: Request,
    ): Promise<void> {
        const user = request.user as { id: number };
        this.logger.debug(
            `이벤트 삭제 요청 처리 중 - userId: ${user.id}, eventId: ${eventId}`,
            EventController.name,
        );

        await this.eventService.deleteEvent(user.id, eventId);
        this.logger.debug(`이벤트 삭제 요청 처리 완료`, EventController.name);
    }
}
