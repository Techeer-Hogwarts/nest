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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EventService } from './event.service';
import { CreateEventRequest } from './dto/request/create.event.request';
import { GetEventResponse } from './dto/response/get.event.response';
import { GetEventListQueryRequest } from './dto/request/get.event.query.request';

@ApiTags('events')
@Controller('/events')
export class EventController {
    constructor(private readonly eventService: EventService) {}

    @Post()
    @ApiOperation({
        summary: '이벤트 생성',
        description: '새로운 이벤트를 생성합니다.',
    })
    async createEvent(
        @Body() createEventRequest: CreateEventRequest,
    ): Promise<any> {
        const event: GetEventResponse =
            await this.eventService.createEvent(createEventRequest);
        return {
            code: 201,
            message: '이벤트를 생성했습니다.',
            data: event,
        };
    }

    @Get()
    @ApiOperation({
        summary: '이벤트 목록 조회 및 검색',
        description: '이벤트 목록을 조회하고 검색합니다.',
    })
    async getEventList(@Query() query: GetEventListQueryRequest): Promise<any> {
        const events: GetEventResponse[] =
            await this.eventService.getEventList(query);
        return {
            code: 200,
            message: '이벤트 목록을 조회했습니다.',
            data: events,
        };
    }

    @Get(':eventId')
    @ApiOperation({
        summary: '단일 이벤트 조회',
        description: '지정된 ID의 이벤트를 조회합니다.',
    })
    async getEvent(
        @Param('eventId', ParseIntPipe) eventId: number,
    ): Promise<any> {
        const event: GetEventResponse =
            await this.eventService.getEvent(eventId);
        return {
            code: 200,
            message: '이벤트를 조회했습니다.',
            data: event,
        };
    }

    @Patch(':eventId')
    @ApiOperation({
        summary: '이벤트 수정',
        description: '지정된 ID의 이벤트를 수정합니다.',
    })
    async updateEvent(
        @Param('eventId', ParseIntPipe) eventId: number,
        @Body() updateEventRequest: CreateEventRequest,
    ): Promise<any> {
        const event: GetEventResponse = await this.eventService.updateEvent(
            eventId,
            updateEventRequest,
        );
        return {
            code: 200,
            message: '이벤트가 수정되었습니다.',
            data: event,
        };
    }

    @Delete(':eventId')
    @ApiOperation({
        summary: '이벤트 삭제',
        description: '지정된 ID의 이벤트를 삭제합니다.',
    })
    async deleteEvent(
        @Param('eventId', ParseIntPipe) eventId: number,
    ): Promise<any> {
        await this.eventService.deleteEvent(eventId);
        return {
            code: 200,
            message: '이벤트가 삭제되었습니다.',
        };
    }
}
