import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../modules/prisma/prisma.service';
import { CreateEventRequest } from '../dto/request/create.event.request';
import { EventEntity } from '../entities/event.entity';
import { GetEventListQueryRequest } from '../dto/request/get.event.query.request';
import { Prisma } from '@prisma/client';
import { NotFoundEventException } from '../../../global/exception/custom.exception';

@Injectable()
export class EventRepository {
    constructor(private prisma: PrismaService) {}

    async createEvent(
        createEventRequest: CreateEventRequest,
    ): Promise<EventEntity> {
        return this.prisma.event.create({
            data: { ...createEventRequest },
        });
    }

    async getEventList(
        query: GetEventListQueryRequest,
    ): Promise<EventEntity[]> {
        const {
            keyword,
            category,
            offset = 0,
            limit = 10,
        }: GetEventListQueryRequest = query;
        return this.prisma.event.findMany({
            where: {
                isDeleted: false,
                ...(keyword && {
                    OR: [
                        {
                            title: {
                                contains: keyword,
                                mode: 'insensitive',
                            },
                        },
                    ],
                }),
                ...(category && { category }),
            },
            skip: offset,
            take: limit,
        });
    }

    async getEvent(eventId: number): Promise<EventEntity> {
        const event: EventEntity = await this.prisma.event.findUnique({
            where: {
                id: eventId,
                isDeleted: false,
            },
        });

        if (!event) {
            throw new NotFoundEventException();
        }
        return event;
    }

    async updateEvent(
        eventId: number,
        updateEventRequest: CreateEventRequest,
    ): Promise<EventEntity> {
        const { category, title, startDate, endDate, url }: CreateEventRequest =
            updateEventRequest;

        try {
            return await this.prisma.event.update({
                where: {
                    id: eventId,
                    isDeleted: false,
                },
                data: {
                    category,
                    title,
                    startDate,
                    endDate,
                    url,
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundEventException();
            }
            throw error;
        }
    }

    async deleteEvent(eventId: number): Promise<void> {
        try {
            await this.prisma.event.update({
                where: {
                    id: eventId,
                    isDeleted: false,
                },
                data: { isDeleted: true },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                throw new NotFoundEventException();
            }
            throw error;
        }
    }
}
