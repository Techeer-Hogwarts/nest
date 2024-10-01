import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from '../session.service';
import { SessionRepository } from '../repository/session.repository';
import { GetSessionDto } from '../dto/response/get.session.dto';
import { NotFoundException } from '@nestjs/common';
import {
    sessionEntity,
    createSessionDto,
    getSessionDto,
    updateSessionDto,
    updatedSessionEntity,
    sessionEntities,
    paginationQueryDto,
    bestSessionEntities,
    getBestSessionDtoList,
    getSessionsQueryDto,
} from './mock-data';

describe('SessionService', () => {
    let service: SessionService;
    let repository: SessionRepository;

    beforeEach(async () => {
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
                        getSessionsByUserId: jest.fn(),
                        deleteSession: jest.fn(),
                        updateSession: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<SessionService>(SessionService);
        repository = module.get<SessionRepository>(SessionRepository);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createSession', () => {
        it('should successfully create a session', async () => {
            jest.spyOn(repository, 'createSession').mockResolvedValue(
                sessionEntity(),
            );

            const result: GetSessionDto =
                await service.createSession(createSessionDto);

            expect(result).toEqual(getSessionDto);
            expect(repository.createSession).toHaveBeenCalledWith(
                createSessionDto,
            );
            expect(repository.createSession).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSession', () => {
        it('should return a GetSessionDto when a session is found', async () => {
            jest.spyOn(repository, 'getSession').mockResolvedValue(
                sessionEntity(),
            );

            const result: GetSessionDto = await service.getSession(1);

            expect(result).toEqual(getSessionDto);
            expect(result).toBeInstanceOf(GetSessionDto);
            expect(repository.getSession).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBestSessions', () => {
        it('should return a list of GetSessionDto objects based on pagination query', async () => {
            jest.spyOn(repository, 'getBestSessions').mockResolvedValue(
                bestSessionEntities,
            );

            const result = await service.getBestSessions(paginationQueryDto);

            expect(result).toEqual(getBestSessionDtoList);
            expect(result.every((item) => item instanceof GetSessionDto)).toBe(
                true,
            );
            expect(repository.getBestSessions).toHaveBeenCalledWith(
                paginationQueryDto,
            );
            expect(repository.getBestSessions).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSessionList', () => {
        it('should return a list of GetSessionDto objects based on query', async () => {
            jest.spyOn(repository, 'getSessionList').mockResolvedValue(
                sessionEntities,
            );

            const result = await service.getSessionList(getSessionsQueryDto);

            expect(result).toEqual(
                sessionEntities.map((session) => new GetSessionDto(session)),
            );
            expect(result.every((item) => item instanceof GetSessionDto)).toBe(
                true,
            );
            expect(repository.getSessionList).toHaveBeenCalledWith(
                getSessionsQueryDto,
            );
            expect(repository.getSessionList).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSesisonsByUserId', () => {
        it('should return a list of GetSessionDto objects for a specific user', async () => {
            jest.spyOn(repository, 'getSessionsByUserId').mockResolvedValue(
                sessionEntities,
            );

            const result = await service.getSessionsByUserId(
                1,
                paginationQueryDto,
            );

            expect(repository.getSessionsByUserId).toHaveBeenCalledWith(
                1,
                paginationQueryDto,
            );
            expect(repository.getSessionsByUserId).toHaveBeenCalledTimes(1);
            expect(result).toEqual(
                sessionEntities.map((session) => new GetSessionDto(session)),
            );
            expect(result.every((item) => item instanceof GetSessionDto)).toBe(
                true,
            );
        });
    });

    describe('deleteSession', () => {
        it('should successfully delete a session', async () => {
            jest.spyOn(repository, 'getSession').mockResolvedValue(
                sessionEntity(),
            );
            jest.spyOn(repository, 'deleteSession').mockResolvedValue(
                undefined,
            );

            await service.deleteSession(1);

            expect(repository.getSession).toHaveBeenCalledWith(1);
            expect(repository.getSession).toHaveBeenCalledTimes(1);
            expect(repository.deleteSession).toHaveBeenCalledWith(1);
            expect(repository.deleteSession).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if session does not exist', async () => {
            jest.spyOn(repository, 'getSession').mockRejectedValue(
                new NotFoundException(),
            );

            await expect(service.deleteSession(1)).rejects.toThrow(
                NotFoundException,
            );
            expect(repository.getSession).toHaveBeenCalledWith(1);
            expect(repository.deleteSession).not.toHaveBeenCalled();
        });
    });

    describe('updateSession', () => {
        it('should successfully update a session and return a GetSessionDto', async () => {
            jest.spyOn(repository, 'getSession').mockResolvedValue(
                sessionEntity(),
            );
            jest.spyOn(repository, 'updateSession').mockResolvedValue(
                updatedSessionEntity,
            );

            const result = await service.updateSession(1, updateSessionDto);

            expect(result).toEqual(new GetSessionDto(updatedSessionEntity));
            expect(result).toBeInstanceOf(GetSessionDto);

            expect(repository.getSession).toHaveBeenCalledWith(1);
            expect(repository.updateSession).toHaveBeenCalledWith(
                1,
                updateSessionDto,
            );

            expect(repository.getSession).toHaveBeenCalledTimes(1);
            expect(repository.updateSession).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the session does not exist', async () => {
            jest.spyOn(repository, 'getSession').mockRejectedValue(
                new NotFoundException(),
            );

            await expect(
                service.updateSession(1, updateSessionDto),
            ).rejects.toThrow(NotFoundException);

            expect(repository.getSession).toHaveBeenCalledWith(1);
            expect(repository.updateSession).not.toHaveBeenCalled();
        });
    });
});
