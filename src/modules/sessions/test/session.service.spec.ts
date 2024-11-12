import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from '../session.service';
import { SessionRepository } from '../repository/session.repository';
import { GetSessionResponse } from '../dto/response/get.session.response';
import {
    sessionEntity,
    createSessionRequest,
    getSessionResponse,
    updateSessionRequest,
    updatedSessionEntity,
    sessionEntities,
    paginationQueryDto,
    bestSessionEntities,
    getBestSessionsResponse,
    getSessionsQueryRequest,
} from './mock-data';
import { SessionEntity } from '../entities/session.entity';
import { NotFoundSessionException } from '../../../global/exception/custom.exception';

describe('SessionService', (): void => {
    let service: SessionService;
    let repository: SessionRepository;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionService,
                {
                    provide: SessionRepository,
                    useValue: {
                        createSession: jest.fn(),
                        getSession: jest.fn(),
                        getBestSessions: jest.fn(),
                        getSessionList: jest.fn(),
                        getSessionsByUser: jest.fn(),
                        deleteSession: jest.fn(),
                        updateSession: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<SessionService>(SessionService);
        repository = module.get<SessionRepository>(SessionRepository);
    });

    it('should be defined', (): void => {
        expect(service).toBeDefined();
    });

    describe('createSession', (): void => {
        it('should successfully create a session', async (): Promise<void> => {
            jest.spyOn(repository, 'createSession').mockResolvedValue(
                sessionEntity(),
            );

            const result: GetSessionResponse =
                await service.createSession(createSessionRequest);

            expect(result).toEqual(getSessionResponse);
            expect(repository.createSession).toHaveBeenCalledWith(
                createSessionRequest,
            );
            expect(repository.createSession).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSession', (): void => {
        it('should return a GetSessionDto when a session is found', async (): Promise<void> => {
            jest.spyOn(repository, 'getSession').mockResolvedValue(
                sessionEntity(),
            );

            const result: GetSessionResponse = await service.getSession(1);

            expect(result).toEqual(getSessionResponse);
            expect(result).toBeInstanceOf(GetSessionResponse);
            expect(repository.getSession).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBestSessions', (): void => {
        it('should return a list of GetSessionDto objects based on pagination query', async (): Promise<void> => {
            jest.spyOn(repository, 'getBestSessions').mockResolvedValue(
                bestSessionEntities,
            );

            const result: GetSessionResponse[] =
                await service.getBestSessions(paginationQueryDto);

            expect(result).toEqual(getBestSessionsResponse);
            expect(
                result.every(
                    (item: SessionEntity): boolean =>
                        item instanceof GetSessionResponse,
                ),
            ).toBe(true);
            expect(repository.getBestSessions).toHaveBeenCalledWith(
                paginationQueryDto,
            );
            expect(repository.getBestSessions).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSessionList', (): void => {
        it('should return a list of GetSessionDto objects based on query', async (): Promise<void> => {
            jest.spyOn(repository, 'getSessionList').mockResolvedValue(
                sessionEntities,
            );

            const result: GetSessionResponse[] = await service.getSessionList(
                getSessionsQueryRequest,
            );

            expect(result).toEqual(
                sessionEntities.map(
                    (session: SessionEntity) => new GetSessionResponse(session),
                ),
            );
            expect(
                result.every(
                    (item: GetSessionResponse): boolean =>
                        item instanceof GetSessionResponse,
                ),
            ).toBe(true);
            expect(repository.getSessionList).toHaveBeenCalledWith(
                getSessionsQueryRequest,
            );
            expect(repository.getSessionList).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSesisonsByUser', (): void => {
        it('should return a list of GetSessionDto objects for a specific user', async (): Promise<void> => {
            jest.spyOn(repository, 'getSessionsByUser').mockResolvedValue(
                sessionEntities,
            );

            const result: GetSessionResponse[] =
                await service.getSessionsByUser(1, paginationQueryDto);

            expect(repository.getSessionsByUser).toHaveBeenCalledWith(
                1,
                paginationQueryDto,
            );
            expect(repository.getSessionsByUser).toHaveBeenCalledTimes(1);
            expect(result).toEqual(
                sessionEntities.map(
                    (session: SessionEntity) => new GetSessionResponse(session),
                ),
            );
            expect(
                result.every(
                    (item: GetSessionResponse): boolean =>
                        item instanceof GetSessionResponse,
                ),
            ).toBe(true);
        });
    });

    describe('deleteSession', (): void => {
        it('should successfully delete a session', async (): Promise<void> => {
            jest.spyOn(repository, 'deleteSession').mockResolvedValue(
                undefined,
            );

            await service.deleteSession(1);

            expect(repository.deleteSession).toHaveBeenCalledWith(1);
            expect(repository.deleteSession).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if session does not exist', async (): Promise<void> => {
            jest.spyOn(repository, 'deleteSession').mockRejectedValue(
                new NotFoundSessionException(),
            );

            await expect(service.deleteSession(1)).rejects.toThrow(
                NotFoundSessionException,
            );
            expect(repository.deleteSession).toHaveBeenCalledWith(1);
            expect(repository.deleteSession).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateSession', (): void => {
        it('should successfully update a session and return a GetSessionDto', async (): Promise<void> => {
            jest.spyOn(repository, 'updateSession').mockResolvedValue(
                updatedSessionEntity,
            );

            const result: GetSessionResponse = await service.updateSession(
                1,
                updateSessionRequest,
            );

            expect(result).toEqual(
                new GetSessionResponse(updatedSessionEntity),
            );
            expect(result).toBeInstanceOf(GetSessionResponse);

            expect(repository.updateSession).toHaveBeenCalledWith(
                1,
                updateSessionRequest,
            );

            expect(repository.updateSession).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the session does not exist', async (): Promise<void> => {
            jest.spyOn(repository, 'updateSession').mockRejectedValue(
                new NotFoundSessionException(),
            );

            await expect(
                service.updateSession(1, updateSessionRequest),
            ).rejects.toThrow(NotFoundSessionException);

            expect(repository.updateSession).toHaveBeenCalledWith(
                1,
                updateSessionRequest,
            );
            expect(repository.updateSession).toHaveBeenCalledTimes(1);
        });
    });
});
