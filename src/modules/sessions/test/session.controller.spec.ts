import { Test, TestingModule } from '@nestjs/testing';
import { SessionController } from '../session.controller';
import { SessionService } from '../session.service';
import { GetSessionDto } from '../dto/response/get.session.dto';
import { NotFoundException } from '@nestjs/common';
import {
    createSessionDto,
    getSessionDto,
    getSessionDtoList,
    getSessionsQueryDto,
    paginationQueryDto,
    sessionEntities,
    updateSessionDto,
    updatedSessionEntity,
} from './mock-data';

describe('SessionController', () => {
    let controller: SessionController;
    let service: SessionService;

    beforeEach(async () => {
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
                        getSessionsByUserId: jest.fn(),
                        deleteSession: jest.fn(),
                        updateSession: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<SessionController>(SessionController);
        service = module.get<SessionService>(SessionService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createSession', () => {
        it('should successfully create a session', async () => {
            jest.spyOn(service, 'createSession').mockResolvedValue(
                getSessionDto,
            );

            const result = await controller.createSession(createSessionDto);

            expect(result).toEqual({
                code: 201,
                message: '세션 게시물을 생성했습니다.',
                data: getSessionDto,
            });
            expect(service.createSession).toHaveBeenCalledWith(
                createSessionDto,
            );
            expect(service.createSession).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSession', () => {
        it('should return a session', async () => {
            jest.spyOn(service, 'getSession').mockResolvedValue(getSessionDto);

            const result = await controller.getSession(1);

            expect(result).toEqual({
                code: 200,
                message: '세션 게시물을 조회했습니다.',
                data: getSessionDto,
            });
            expect(service.getSession).toHaveBeenCalledWith(1);
            expect(service.getSession).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBestSessions', () => {
        it('should return a list of best sessions based on popularity', async () => {
            jest.spyOn(service, 'getBestSessions').mockResolvedValue(
                sessionEntities.map((session) => new GetSessionDto(session)),
            );

            const result = await controller.getBestSessions(paginationQueryDto);

            expect(result).toEqual({
                code: 200,
                message: '인기 세션 게시물 목록을 조회했습니다.',
                data: sessionEntities.map(
                    (session) => new GetSessionDto(session),
                ),
            });
            expect(service.getBestSessions).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSessionList', () => {
        it('should return a list of sessions based on query', async () => {
            jest.spyOn(service, 'getSessionList').mockResolvedValue(
                getSessionDtoList,
            );

            const result = await controller.getSessionList(getSessionsQueryDto);

            expect(result).toEqual({
                code: 200,
                message: '세션 게시물 목록을 조회했습니다.',
                data: getSessionDtoList,
            });
            expect(service.getSessionList).toHaveBeenCalledWith(
                getSessionsQueryDto,
            );
            expect(service.getSessionList).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSessionsByUserId', () => {
        it('should return a list of sessions for a specific user', async () => {
            jest.spyOn(service, 'getSessionsByUserId').mockResolvedValue(
                sessionEntities.map((session) => new GetSessionDto(session)),
            );

            const result = await controller.getSessionsByUserId(
                1,
                paginationQueryDto,
            );

            expect(result).toEqual({
                code: 200,
                message: '해당 유저의 세션 게시물 목록을 조회했습니다.',
                data: sessionEntities.map(
                    (session) => new GetSessionDto(session),
                ),
            });
            expect(service.getSessionsByUserId).toHaveBeenCalledWith(
                1,
                paginationQueryDto,
            );
            expect(service.getSessionsByUserId).toHaveBeenCalledTimes(1);
        });
    });

    describe('deleteSession', () => {
        it('should successfully delete a session', async () => {
            jest.spyOn(service, 'deleteSession').mockResolvedValue();

            const result = await controller.deleteSession(1);

            expect(result).toEqual({
                code: 200,
                message: '세션 게시물이 삭제되었습니다.',
            });

            expect(service.deleteSession).toHaveBeenCalledWith(1);
            expect(service.deleteSession).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the session does not exist', async () => {
            jest.spyOn(service, 'deleteSession').mockRejectedValue(
                new NotFoundException('게시물을 찾을 수 없습니다.'),
            );

            await expect(controller.deleteSession(1)).rejects.toThrow(
                NotFoundException,
            );

            expect(service.deleteSession).toHaveBeenCalledWith(1);
            expect(service.deleteSession).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateSession', () => {
        it('should successfully update a session', async () => {
            jest.spyOn(service, 'updateSession').mockResolvedValue(
                new GetSessionDto(updatedSessionEntity),
            );

            const result = await controller.updateSession(1, updateSessionDto);

            expect(result).toEqual({
                code: 200,
                message: '세션 게시물이 수정되었습니다.',
                data: new GetSessionDto(updatedSessionEntity),
            });
            expect(service.updateSession).toHaveBeenCalledWith(
                1,
                updateSessionDto,
            );
            expect(service.updateSession).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException if the session does not exist', async () => {
            jest.spyOn(service, 'updateSession').mockRejectedValue(
                new NotFoundException('게시물을 찾을 수 없습니다.'),
            );

            await expect(
                controller.updateSession(1, updateSessionDto),
            ).rejects.toThrow(NotFoundException);

            expect(service.updateSession).toHaveBeenCalledWith(
                1,
                updateSessionDto,
            );
            expect(service.updateSession).toHaveBeenCalledTimes(1);
        });
    });
});
