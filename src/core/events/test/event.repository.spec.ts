// import { PrismaService } from '../../../infra/prisma/prisma.service';
// import { EventRepository } from '../repository/event.repository';
// import { Test, TestingModule } from '@nestjs/testing';
// import {
//     createEventRequest,
//     eventEntities,
//     eventEntity,
//     getEventListQueryRequest,
//     updatedEventEntity,
//     updateEventRequest,
// } from './mock-data';
// import { EventEntity } from '../entities/event.entity';
// import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
// import { IndexService } from '../../../infra/index/index.service';

// describe('EventRepository', (): void => {
//     let repository: EventRepository;
//     let prismaService: PrismaService;

//     beforeEach(async (): Promise<void> => {
//         const module: TestingModule = await Test.createTestingModule({
//             providers: [
//                 EventRepository,
//                 {
//                     provide: PrismaService,
//                     useValue: {
//                         event: {
//                             create: jest.fn(),
//                             findMany: jest.fn(),
//                             findUnique: jest.fn(),
//                             update: jest.fn(),
//                         },
//                     },
//                 },
//                 {
//                     provide: CustomWinstonLogger,
//                     useValue: {
//                         debug: jest.fn(),
//                         error: jest.fn(),
//                     },
//                 },
//                 {
//                     provide: IndexService,
//                     useValue: {
//                         createIndex: jest.fn(),
//                         deleteIndex: jest.fn(),
//                     },
//                 },
//             ],
//         }).compile();

//         repository = module.get<EventRepository>(EventRepository);
//         prismaService = module.get<PrismaService>(PrismaService);
//     });

//     it('should be defined', (): void => {
//         expect(repository).toBeDefined();
//     });

//     describe('findById', (): void => {
//         it('should return a event when it exists', async () => {
//             jest.spyOn(prismaService.event, 'findUnique').mockResolvedValue(
//                 eventEntity(),
//             );

//             const result = await repository.findById(100);

//             expect(prismaService.event.findUnique).toHaveBeenCalledWith({
//                 where: {
//                     id: 100,
//                     isDeleted: false,
//                 },
//                 include: { user: true },
//             });
//             expect(result).toEqual(eventEntity());
//         });

//         it('should return null when the event does not exist', async () => {
//             jest.spyOn(prismaService.event, 'findUnique').mockResolvedValue(
//                 null,
//             );

//             const result = await repository.findById(100);

//             expect(prismaService.event.findUnique).toHaveBeenCalledWith({
//                 where: {
//                     id: 100,
//                     isDeleted: false,
//                 },
//                 include: { user: true },
//             });
//             expect(result).toBeNull();
//         });
//     });

//     describe('createEvent', (): void => {
//         it('should successfully create a event', async (): Promise<void> => {
//             jest.spyOn(prismaService.event, 'create').mockResolvedValue(
//                 eventEntity(),
//             );

//             const result: EventEntity = await repository.createEvent(
//                 1,
//                 createEventRequest,
//             );

//             expect(result).toEqual(eventEntity());
//             expect(prismaService.event.create).toHaveBeenCalledWith({
//                 data: {
//                     userId: 1,
//                     ...createEventRequest,
//                 },
//                 include: { user: true },
//             });
//             expect(prismaService.event.create).toHaveBeenCalledTimes(1);
//         });
//     });

//     describe('getEventList', (): void => {
//         it('should return a list of event entities based on query', async (): Promise<void> => {
//             jest.spyOn(prismaService.event, 'findMany').mockResolvedValue(
//                 eventEntities,
//             );

//             const result: EventEntity[] = await repository.getEventList(
//                 getEventListQueryRequest,
//             );

//             expect(result).toEqual(eventEntities);
//             expect(prismaService.event.findMany).toHaveBeenCalledWith({
//                 where: {
//                     isDeleted: false,
//                     ...(getEventListQueryRequest.keyword && {
//                         OR: [
//                             {
//                                 title: {
//                                     contains: getEventListQueryRequest.keyword,
//                                     mode: 'insensitive',
//                                 },
//                             },
//                         ],
//                     }),
//                     ...(getEventListQueryRequest.category && {
//                         category: { in: getEventListQueryRequest.category },
//                     }),
//                 },
//                 include: { user: true },
//                 skip: getEventListQueryRequest.offset,
//                 take: getEventListQueryRequest.limit,
//             });
//             expect(prismaService.event.findMany).toHaveBeenCalledTimes(1);
//         });
//     });

//     describe('getEvent', (): void => {
//         it('should return a event entity if found', async (): Promise<void> => {
//             jest.spyOn(prismaService.event, 'findUnique').mockResolvedValue(
//                 eventEntity(),
//             );

//             expect(await repository.getEvent(1)).toEqual(eventEntity());
//         });
//     });

//     describe('updateEvent', (): void => {
//         it('should successfully update a event', async (): Promise<void> => {
//             jest.spyOn(prismaService.event, 'update').mockResolvedValue(
//                 updatedEventEntity,
//             );

//             const result: EventEntity = await repository.updateEvent(
//                 1,
//                 updateEventRequest,
//             );

//             expect(result).toEqual(updatedEventEntity);
//             expect(prismaService.event.update).toHaveBeenCalledWith({
//                 where: {
//                     id: 1,
//                     isDeleted: false,
//                 },
//                 data: updateEventRequest,
//                 include: { user: true },
//             });
//             expect(prismaService.event.update).toHaveBeenCalledTimes(1);
//         });
//     });

//     describe('deleteEvent', (): void => {
//         it('should mark the event as deleted', async (): Promise<void> => {
//             jest.spyOn(prismaService.event, 'update').mockResolvedValue({
//                 ...eventEntity(),
//                 isDeleted: true,
//             });

//             await repository.deleteEvent(1);

//             expect(prismaService.event.update).toHaveBeenCalledWith({
//                 where: {
//                     id: 1,
//                     isDeleted: false,
//                 },
//                 data: { isDeleted: true },
//             });
//             expect(prismaService.event.update).toHaveBeenCalledTimes(1);
//         });
//     });
// });
