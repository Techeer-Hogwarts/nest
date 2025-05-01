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
import { JwtAuthGuard } from '../../core/auth/jwt.guard';

import { EventService } from '../../core/events/event.service';

import { CreateEventRequest } from '../../common/dto/events/request/create.event.request';
import { GetEventListQueryRequest } from '../../common/dto/events/request/get.event.query.request';

import { CreateEventResponse } from '../../common/dto/events/response/create.event.response';
import { GetEventResponse } from '../../common/dto/events/response/get.event.response';

import {
    EventControllerDoc,
    CreateEventDoc,
    GetEventListDoc,
    GetEventDoc,
    UpdateEventDoc,
    DeleteEventDoc,
} from './event.docs';

@EventControllerDoc()
@Controller('/events')
export class EventController {
    constructor(
        private readonly eventService: EventService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    @CreateEventDoc()
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
    @GetEventListDoc()
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
    @GetEventDoc()
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
    @UpdateEventDoc()
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
    @DeleteEventDoc()
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
