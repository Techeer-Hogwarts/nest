import { StackRepository } from '../repository/stack.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';
import { mockPrismaRequest } from './mock-data';

describe('StackRepository', (): void => {
    let repository: StackRepository;
    let prismaService: PrismaService;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StackRepository,
                {
                    provide: PrismaService,
                    useValue: {
                        stack: {
                            create: jest.fn(),
                        },
                    },
                },
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        debug: jest.fn(),
                        error: jest.fn(),
                    },
                },
            ],
        }).compile();

        repository = module.get<StackRepository>(StackRepository);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    describe('createStack', (): void => {
        it('should create a new stack in the database', async (): Promise<void> => {
            jest.spyOn(prismaService.stack, 'create').mockResolvedValue(
                undefined,
            );

            await repository.createStack(mockPrismaRequest);

            expect(prismaService.stack.create).toHaveBeenCalledWith({
                data: mockPrismaRequest,
            });
            expect(prismaService.stack.create).toHaveBeenCalledTimes(1);
        });
    });
});
