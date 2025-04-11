import { Injectable } from '@nestjs/common';
import { EventRepository } from './repository/event.repository';
import { CreateEventRequest } from '../../common/dto/events/request/create.event.request';
import { EventEntity } from './entities/event.entity';
import { GetEventListQueryRequest } from '../../common/dto/events/request/get.event.query.request';
import { ForbiddenAccessException } from '../../common/exception/custom.exception';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { CreateEventResponse } from '../../common/dto/events/response/creare.event.response';
import { GetEventResponse } from '../../common/dto/events/response/get.event.response';

@Injectable()
export class EventService {
    constructor(
        private readonly eventRepository: EventRepository,
        private readonly logger: CustomWinstonLogger,
    ) {}

    async createEvent(
        userId: number,
        createEventRequest: CreateEventRequest,
    ): Promise<CreateEventResponse> {
        this.logger.debug(`이벤트 생성 중`, EventService.name);

        const eventEntity: EventEntity = await this.eventRepository.createEvent(
            userId,
            createEventRequest,
        );
        return new CreateEventResponse(eventEntity);
    }

    async getEventList(
        query: GetEventListQueryRequest,
    ): Promise<GetEventResponse[]> {
        this.logger.debug(`이벤트 목록 조회 중`, EventService.name);

        const events: EventEntity[] =
            await this.eventRepository.getEventList(query);
        this.logger.debug(
            `이벤트 목록 조회 완료 - 조회된 개수: ${events.length}`,
            EventService.name,
        );
        return events.map((event: EventEntity) => new GetEventResponse(event));
    }

    async getEvent(eventId: number): Promise<GetEventResponse> {
        this.logger.debug(`단일 이벤트 조회 중`, EventService.name);

        const eventEntity: EventEntity =
            await this.eventRepository.getEvent(eventId);
        return new GetEventResponse(eventEntity);
    }

    async updateEvent(
        userId: number,
        eventId: number,
        updateEventRequest: CreateEventRequest,
    ): Promise<CreateEventResponse> {
        this.logger.debug(`이벤트 수정 중`, EventService.name);
        const event = await this.eventRepository.findById(eventId);

        if (event.userId !== userId) {
            this.logger.error(`이벤트 수정 권한 없음`, EventService.name);
            throw new ForbiddenAccessException();
        }

        const updatedEvent: EventEntity =
            await this.eventRepository.updateEvent(eventId, updateEventRequest);
        return new CreateEventResponse(updatedEvent);
    }

    async deleteEvent(userId: number, eventId: number): Promise<void> {
        this.logger.debug(`이벤트 삭제 중`, EventService.name);

        const event = await this.eventRepository.findById(eventId);

        if (event.userId !== userId) {
            this.logger.error(`이벤트 삭제 권한 없음`, EventService.name);
            throw new ForbiddenAccessException();
        }

        return this.eventRepository.deleteEvent(eventId);
    }
}
