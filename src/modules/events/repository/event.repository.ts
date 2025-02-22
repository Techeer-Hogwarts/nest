import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../modules/prisma/prisma.service';
import { CreateEventRequest } from '../dto/request/create.event.request';
import { EventEntity } from '../entities/event.entity';
import { GetEventListQueryRequest } from '../dto/request/get.event.query.request';
import { Prisma } from '@prisma/client';
import { NotFoundEventException } from '../../../global/exception/custom.exception';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';
import { IndexEventRequest } from '../dto/request/index.event.request';
import { IndexService } from '../../../global/index/index.service';

@Injectable()
export class EventRepository {
    constructor(
        private prisma: PrismaService,
        private readonly logger: CustomWinstonLogger,
        private readonly indexService: IndexService,
    ) {}

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
        const event: EventEntity = await this.prisma.event.create({
            data: {
                userId,
                ...createEventRequest,
            },
            include: { user: true },
        });
        const indexEvent = new IndexEventRequest(event);
        this.logger.debug(
            `이벤트 생성 완료 후 인덱스 업데이트 요청 - ${JSON.stringify(indexEvent)}`,
            EventRepository.name,
        );
        await this.indexService.createIndex<IndexEventRequest>(
            'event',
            indexEvent,
        );
        return event;
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
                ...(category &&
                    category.length > 0 && { category: { in: category } }),
            },
            include: {
                user: true,
            },
            skip: offset,
            take: limit,
        });
    }

    async getEvent(eventId: number): Promise<EventEntity> {
        try {
            const event: EventEntity = await this.prisma.event.findUnique({
                where: {
                    id: eventId,
                    isDeleted: false,
                },
                include: {
                    user: true,
                },
            });
            return event;
        } catch (error) {
            this.logger.error(`이벤트를 찾을 수 없음`, EventRepository.name);
            throw new NotFoundEventException();
        }
    }

    async updateEvent(
        eventId: number,
        updateEventRequest: CreateEventRequest,
    ): Promise<EventEntity> {
        const { category, title, startDate, endDate, url }: CreateEventRequest =
            updateEventRequest;

        try {
            const event = await this.prisma.event.update({
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
            const indexEvent = new IndexEventRequest(event);
            this.logger.debug(
                `이벤트 수정 완료 후 인덱스 업데이트 요청 - ${JSON.stringify(indexEvent)}`,
                EventRepository.name,
            );
            await this.indexService.createIndex<IndexEventRequest>(
                'event',
                indexEvent,
            );
            return event;
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                this.logger.error(
                    `이벤트를 찾을 수 없음`,
                    EventRepository.name,
                );
                throw new NotFoundEventException();
            }
            throw error;
        }
    }

    async deleteEvent(eventId: number): Promise<void> {
        try {
            const event = await this.prisma.event.update({
                where: {
                    id: eventId,
                    isDeleted: false,
                },
                data: { isDeleted: true },
            });
            await this.indexService.deleteIndex('event', String(event.id));
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                this.logger.error(
                    `이벤트를 찾을 수 없음`,
                    EventRepository.name,
                );
                throw new NotFoundEventException();
            }
            throw error;
        }
    }
}
