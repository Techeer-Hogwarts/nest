import { Test, TestingModule } from '@nestjs/testing';

import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import {
    ProjectMemberAlreadyActiveException,
    ProjectMemberApplicationExistsException,
    ProjectMemberInvalidActiveRequesterException,
    ProjectMemberNotFoundException,
} from './exception/projectMember.exception';
import { ProjectMemberService } from './projectMember.service';

import { MemberStatus } from '../../common/category/teamCategory/member.category';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { PrismaService } from '../../infra/prisma/prisma.service';

let prisma: DeepMockProxy<PrismaService>;

describe('ProjectMemberService', () => {
    let service: ProjectMemberService;
    prisma = mockDeep<PrismaService>();

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProjectMemberService,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        error: jest.fn(),
                        debug: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get<ProjectMemberService>(ProjectMemberService);
    });

    describe('isProjectMember', () => {
        it('프로젝트 멤버 활동 중이면 성공한다.', async () => {
            prisma.projectMember.findFirst.mockResolvedValue({
                id: 1,
                status: MemberStatus.APPROVED,
                isDeleted: false,
            } as any);

            await expect(service.isProjectMember(1, 1)).resolves.not.toThrow();
        });

        it('프로젝트 멤버가 아니거나 비활동 상태이면 예외가 발생한다.', async () => {
            prisma.projectMember.findFirst.mockResolvedValue(null);

            await expect(service.isProjectMember(1, 1)).rejects.toThrow(
                ProjectMemberInvalidActiveRequesterException,
            );
        });
    });

    describe('findManyProjectLeaders', () => {
        it('프로젝트 팀 리더가 없는 경우 로그 에러를 발생시킨다.', async () => {
            const logger = jest.spyOn(service['logger'], 'error');
            prisma.projectMember.findMany.mockResolvedValue([]);

            await service.findManyProjectLeaders(1);
            expect(logger).toHaveBeenCalledWith(
                '프로젝트 지원에서 팀 리더를 찾을 수 없습니다.',
            );
        });
    });

    describe('upsertAppliedApplicant', () => {
        it('이전 신청 이력이 없으면 새로 upsert 한다.', async () => {
            prisma.$transaction.mockImplementation(async (cb) => cb(prisma));
            prisma.projectMember.findUnique.mockResolvedValue(null);
            prisma.projectMember.upsert.mockResolvedValue({ id: 1 } as any);

            const result = await service.upsertAppliedApplicant(
                1,
                1,
                'Frontend',
                'summary',
            );
            expect(result).toEqual({ id: 1 });
        });

        it('이미 지원 중인 경우 ProjectMemberApplicationExistsException 예외를 던진다.', async () => {
            prisma.$transaction.mockImplementation(async (cb) => cb(prisma));
            prisma.projectMember.findUnique.mockResolvedValue({
                status: MemberStatus.PENDING,
            } as any);

            await expect(
                service.upsertAppliedApplicant(1, 1, 'Frontend', 'summary'),
            ).rejects.toThrow(ProjectMemberApplicationExistsException);
        });

        it('이미 승인된 상태이고 삭제되지 않았다면 ProjectMemberAlreadyActiveException 예외를 던진다', async () => {
            prisma.$transaction.mockImplementation(async (cb) => cb(prisma));
            prisma.projectMember.findUnique.mockResolvedValue({
                status: MemberStatus.APPROVED,
                isDeleted: false,
            } as any);

            await expect(
                service.upsertAppliedApplicant(1, 1, 'Frontend', 'summary'),
            ).rejects.toThrow(ProjectMemberAlreadyActiveException);
        });
    });

    describe('updateCancelledApplicant', () => {
        it('지원자가 존재하지 않으면 ProjectMemberNotFoundException 예외를 던진다', async () => {
            prisma.$transaction.mockImplementation(async (cb) => cb(prisma));
            prisma.projectMember.findUnique.mockResolvedValue({
                id: 1,
                userId: 1,
            } as any);
            prisma.projectMember.update.mockResolvedValue({ id: 1 } as any);

            const result = await service.updateCancelledApplicant(1, 1);
            expect(result).toEqual({ id: 1 });
        });

        it('should throw if no applicant found', async () => {
            prisma.$transaction.mockImplementation(async (cb) => cb(prisma));
            prisma.projectMember.findUnique.mockResolvedValue(null);

            await expect(
                service.updateCancelledApplicant(1, 1),
            ).rejects.toThrow(ProjectMemberNotFoundException);
        });
    });
});
