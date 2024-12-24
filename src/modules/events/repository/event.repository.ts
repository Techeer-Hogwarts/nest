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

    async findById(eventId: number): Promise<EventEntity | null> {
        return this.prisma.event.findUnique({
            where: {
                id: eventId,
                isDeleted: false,
            },
            include: {
                user: true,
            },
        });
    }

    async createEvent(
        userId: number,
        createEventRequest: CreateEventRequest,
    ): Promise<EventEntity> {
        return this.prisma.event.create({
            data: {
                userId,
                ...createEventRequest,
            },
            include: { user: true },
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
            include: {
                user: true,
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
            include: {
                user: true,
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
                include: {
                    user: true,
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
