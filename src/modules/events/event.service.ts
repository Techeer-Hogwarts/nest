import { Injectable } from '@nestjs/common';
import { EventRepository } from './repository/event.repository';
import { CreateEventRequest } from './dto/request/create.event.request';
import { GetEventResponse } from './dto/response/get.event.response';
import { EventEntity } from './entities/event.entity';
import { GetEventListQueryRequest } from './dto/request/get.event.query.request';
import { ForbiddenAccessException } from '../../global/exception/custom.exception';

@Injectable()
export class EventService {
    constructor(private readonly eventRepository: EventRepository) {}

    async createEvent(
        userId: number,
        createEventRequest: CreateEventRequest,
    ): Promise<GetEventResponse> {
        const eventEntity: EventEntity = await this.eventRepository.createEvent(
            userId,
            createEventRequest,
        );
        return new GetEventResponse(eventEntity);
    }

    async getEventList(
        query: GetEventListQueryRequest,
    ): Promise<GetEventResponse[]> {
        const events: EventEntity[] =
            await this.eventRepository.getEventList(query);
        return events.map((event: EventEntity) => new GetEventResponse(event));
    }

    async getEvent(eventId: number): Promise<GetEventResponse> {
        const eventEntity: EventEntity =
            await this.eventRepository.getEvent(eventId);
        return new GetEventResponse(eventEntity);
    }

    async updateEvent(
        userId: number,
        eventId: number,
        updateEventRequest: CreateEventRequest,
    ): Promise<GetEventResponse> {
        const event = await this.eventRepository.findById(eventId);

        if (event.userId !== userId) {
            throw new ForbiddenAccessException();
        }

        const updatedEvent: EventEntity =
            await this.eventRepository.updateEvent(eventId, updateEventRequest);
        return new GetEventResponse(updatedEvent);
    }

    async deleteEvent(userId: number, eventId: number): Promise<void> {
        const event = await this.eventRepository.findById(eventId);

        if (event.userId !== userId) {
            throw new ForbiddenAccessException();
        }

        return this.eventRepository.deleteEvent(eventId);
    }
}
