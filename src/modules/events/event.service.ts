import { Injectable } from '@nestjs/common';
import { EventRepository } from './repository/event.repository';
import { CreateEventRequest } from './dto/request/create.event.request';
import { GetEventResponse } from './dto/response/get.event.response';
import { EventEntity } from './entities/event.entity';
import { GetEventListQueryRequest } from './dto/request/get.event.query.request';

@Injectable()
export class EventService {
    constructor(private readonly eventRepository: EventRepository) {}

    async createEvent(
        createEventRequest: CreateEventRequest,
    ): Promise<GetEventResponse> {
        const eventEntity: EventEntity =
            await this.eventRepository.createEvent(createEventRequest);
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
        eventId: number,
        updateEventRequest: CreateEventRequest,
    ): Promise<GetEventResponse> {
        const event: EventEntity = await this.eventRepository.updateEvent(
            eventId,
            updateEventRequest,
        );
        return new GetEventResponse(event);
    }

    async deleteEvent(eventId: number): Promise<void> {
        return this.eventRepository.deleteEvent(eventId);
    }
}
