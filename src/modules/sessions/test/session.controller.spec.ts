import { Test, TestingModule } from '@nestjs/testing';
import { SessionController } from '../session.controller';
import { SessionService } from '../session.service';
import { GetSessionResponse } from '../dto/response/get.session.response';
import {
    createSessionRequest,
    getSessionResponse,
    getSessionListResponse,
    getSessionsQueryRequest,
    paginationQueryDto,
    sessionEntities,
    updateSessionRequest,
    updatedSessionEntity,
} from './mock-data';
import { SessionEntity } from '../entities/session.entity';
import { NotFoundSessionException } from '../../../global/exception/custom.exception';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../auth/jwt.guard';

describe('SessionController', () => {
    let controller: SessionController;
    let service: SessionService;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SessionController],
            providers: [
                {
                    provide: SessionService,
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
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: jest.fn().mockReturnValue(true),
            })
            .compile();

        controller = module.get<SessionController>(SessionController);
        service = module.get<SessionService>(SessionService);
    });

    it('should be defined', (): void => {
        expect(controller).toBeDefined();
    });

    describe('createSession', (): void => {
        it('should successfully create a session', async (): Promise<void> => {
            jest.spyOn(service, 'createSession').mockResolvedValue(
                getSessionResponse,
            );

            const request = { user: { id: 1 } } as unknown as Request;
            const result = await controller.createSession(
                createSessionRequest,
                request,
            );

            expect(result).toEqual({
                code: 201,
                message: '세션 게시물을 생성했습니다.',
                data: getSessionResponse,
            });
            expect(service.createSession).toHaveBeenCalledWith(
                1,
                createSessionRequest,
            );
            expect(service.createSession).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSession', (): void => {
        it('should return a session', async (): Promise<void> => {
            jest.spyOn(service, 'getSession').mockResolvedValue(
                getSessionResponse,
            );

            const result = await controller.getSession(1);

            expect(result).toEqual({
                code: 200,
                message: '세션 게시물을 조회했습니다.',
                data: getSessionResponse,
            });
            expect(service.getSession).toHaveBeenCalledWith(1);
            expect(service.getSession).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBestSessions', (): void => {
        it('should return a list of best sessions based on popularity', async (): Promise<void> => {
            jest.spyOn(service, 'getBestSessions').mockResolvedValue(
                sessionEntities.map(
                    (session: SessionEntity) => new GetSessionResponse(session),
                ),
            );

            const result = await controller.getBestSessions(paginationQueryDto);

            expect(result).toEqual({
                code: 200,
                message: '인기 세션 게시물 목록을 조회했습니다.',
                data: sessionEntities.map(
                    (session: SessionEntity) => new GetSessionResponse(session),
                ),
            });
            expect(service.getBestSessions).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSessionList', (): void => {
        it('should return a list of sessions based on query', async (): Promise<void> => {
            jest.spyOn(service, 'getSessionList').mockResolvedValue(
                getSessionListResponse,
            );

            const result = await controller.getSessionList(
                getSessionsQueryRequest,
            );

            expect(result).toEqual({
                code: 200,
                message: '세션 게시물 목록을 조회했습니다.',
                data: getSessionListResponse,
            });
            expect(service.getSessionList).toHaveBeenCalledWith(
                getSessionsQueryRequest,
            );
            expect(service.getSessionList).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSessionsByUser', (): void => {
        it('should return a list of sessions for a specific user', async (): Promise<void> => {
            jest.spyOn(service, 'getSessionsByUser').mockResolvedValue(
                sessionEntities.map(
                    (session: SessionEntity) => new GetSessionResponse(session),
                ),
            );

            const result = await controller.getSessionsByUser(
                1,
                paginationQueryDto,
            );

            expect(result).toEqual({
                code: 200,
                message: '해당 유저의 세션 게시물 목록을 조회했습니다.',
                data: sessionEntities.map(
                    (session: SessionEntity) => new GetSessionResponse(session),
                ),
            });
            expect(service.getSessionsByUser).toHaveBeenCalledWith(
                1,
                paginationQueryDto,
            );
            expect(service.getSessionsByUser).toHaveBeenCalledTimes(1);
        });
    });

    describe('deleteSession', (): void => {
        it('should successfully delete a session', async (): Promise<void> => {
            jest.spyOn(service, 'deleteSession').mockResolvedValue();

            const request = { user: { id: 1 } } as unknown as Request;
            const result = await controller.deleteSession(100, request);

            expect(result).toEqual({
                code: 200,
                message: '세션 게시물이 삭제되었습니다.',
            });

            expect(service.deleteSession).toHaveBeenCalledWith(1, 100);
            expect(service.deleteSession).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the session does not exist', async (): Promise<void> => {
            jest.spyOn(service, 'deleteSession').mockRejectedValue(
                new NotFoundSessionException(),
            );

            const request = { user: { id: 1 } } as unknown as Request;

            await expect(
                controller.deleteSession(100, request),
            ).rejects.toThrow(NotFoundSessionException);

            expect(service.deleteSession).toHaveBeenCalledWith(1, 100);
            expect(service.deleteSession).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateSession', (): void => {
        it('should successfully update a session', async (): Promise<void> => {
            jest.spyOn(service, 'updateSession').mockResolvedValue(
                new GetSessionResponse(updatedSessionEntity),
            );

            const request = { user: { id: 1 } } as unknown as Request;
            const result = await controller.updateSession(
                100,
                updateSessionRequest,
                request,
            );

            expect(result).toEqual({
                code: 200,
                message: '세션 게시물이 수정되었습니다.',
                data: new GetSessionResponse(updatedSessionEntity),
            });
            expect(service.updateSession).toHaveBeenCalledWith(
                1,
                100,
                updateSessionRequest,
            );
            expect(service.updateSession).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the session does not exist', async (): Promise<void> => {
            jest.spyOn(service, 'updateSession').mockRejectedValue(
                new NotFoundSessionException(),
            );

            const request = { user: { id: 1 } } as unknown as Request;

            await expect(
                controller.updateSession(100, updateSessionRequest, request),
            ).rejects.toThrow(NotFoundSessionException);

            expect(service.updateSession).toHaveBeenCalledWith(
                1,
                100,
                updateSessionRequest,
            );
            expect(service.updateSession).toHaveBeenCalledTimes(1);
        });
    });
});
