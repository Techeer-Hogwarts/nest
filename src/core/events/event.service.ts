import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import {
    ForbiddenAccessException,
    NotFoundEventException,
} from '../../common/exception/custom.exception';

import { IndexService } from '../../infra/index/index.service';
import { PrismaService } from '../../infra/prisma/prisma.service';

import { Event } from '@prisma/client';

import { CreateEventRequest } from '../../common/dto/events/request/create.event.request';
import { GetEventListQueryRequest } from '../../common/dto/events/request/get.event.query.request';
import { IndexEventRequest } from '../../common/dto/events/request/index.event.request';

import { CreateEventResponse } from '../../common/dto/events/response/creare.event.response';
import { GetEventResponse } from '../../common/dto/events/response/get.event.response';

@Injectable()
export class EventService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: CustomWinstonLogger,
        private readonly indexService: IndexService,
    ) {}

    async findById(eventId: number): Promise<Event | null> {
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
    ): Promise<CreateEventResponse> {
        this.logger.debug(`이벤트 생성 중`, EventService.name);

        const event = await this.prisma.event.create({
            data: {
                userId,
                ...createEventRequest,
            },
            include: { user: true },
        });
        const indexEvent = new IndexEventRequest(event);
        this.logger.debug(
            `이벤트 생성 완료 후 인덱스 업데이트 요청 - ${JSON.stringify(indexEvent)}`,
            EventService.name,
        );
        await this.indexService.createIndex<IndexEventRequest>(
            'event',
            indexEvent,
        );
        return new CreateEventResponse(event);
    }

    async getEventList(
        query: GetEventListQueryRequest,
    ): Promise<GetEventResponse[]> {
        this.logger.debug(`이벤트 목록 조회 중`, EventService.name);

        const { keyword, category, offset = 0, limit = 10 } = query;

        const events = await this.prisma.event.findMany({
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

        this.logger.debug(
            `이벤트 목록 조회 완료 - 조회된 개수: ${events.length}`,
            EventService.name,
        );
        return events.map((event) => new GetEventResponse(event));
    }

    async getEvent(eventId: number): Promise<GetEventResponse> {
        this.logger.debug(`단일 이벤트 조회 중`, EventService.name);

        try {
            const event = await this.prisma.event.findUnique({
                where: {
                    id: eventId,
                    isDeleted: false,
                },
                include: {
                    user: true,
                },
            });
            return new GetEventResponse(event);
        } catch {
            this.logger.error(`이벤트를 찾을 수 없음`, EventService.name);
            throw new NotFoundEventException();
        }
    }

    async updateEvent(
        userId: number,
        eventId: number,
        updateEventRequest: CreateEventRequest,
    ): Promise<CreateEventResponse> {
        this.logger.debug(`이벤트 수정 중`, EventService.name);
        const event = await this.findById(eventId);

        if (event.userId !== userId) {
            this.logger.error(`이벤트 수정 권한 없음`, EventService.name);
            throw new ForbiddenAccessException();
        }

        try {
            const updatedEvent = await this.prisma.event.update({
                where: {
                    id: eventId,
                    isDeleted: false,
                },
                data: updateEventRequest,
                include: {
                    user: true,
                },
            });
            const indexEvent = new IndexEventRequest(updatedEvent);
            this.logger.debug(
                `이벤트 수정 완료 후 인덱스 업데이트 요청 - ${JSON.stringify(indexEvent)}`,
                EventService.name,
            );
            await this.indexService.createIndex<IndexEventRequest>(
                'event',
                indexEvent,
            );
            return new CreateEventResponse(updatedEvent);
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                this.logger.error(`이벤트를 찾을 수 없음`, EventService.name);
                throw new NotFoundEventException();
            }
            throw error;
        }
    }

    async deleteEvent(userId: number, eventId: number): Promise<void> {
        this.logger.debug(`이벤트 삭제 중`, EventService.name);

        const event = await this.findById(eventId);

        if (event.userId !== userId) {
            this.logger.error(`이벤트 삭제 권한 없음`, EventService.name);
            throw new ForbiddenAccessException();
        }

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
                this.logger.error(`이벤트를 찾을 수 없음`, EventService.name);
                throw new NotFoundEventException();
            }
            throw error;
        }
    }
}
