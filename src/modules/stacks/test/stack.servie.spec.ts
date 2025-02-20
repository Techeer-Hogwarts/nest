import { Test, TestingModule } from '@nestjs/testing';
import { StackService } from '../stack.service';
import { StackRepository } from '../repository/stack.repository';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';
import { mockRequest, mockPrismaRequest, mockStacks } from './mock-data';
import { GetStackResponse } from '../dto/response/get.stack.response';

describe('StackService', () => {
    let stackService: StackService;
    let repository: StackRepository;

    beforeEach(async (): Promise<void> => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StackService,
                {
                    provide: StackRepository,
                    useValue: {
                        createStack: jest.fn(),
                        findAll: jest.fn(),
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

        stackService = module.get<StackService>(StackService);
        repository = module.get<StackRepository>(StackRepository);
    });

    it('should be defined', (): void => {
        expect(stackService).toBeDefined();
    });

    describe('createStack', (): void => {
        it('should call repository.createStack()', async (): Promise<void> => {
            jest.spyOn(repository, 'createStack').mockResolvedValue(undefined);

            await stackService.createStack(mockRequest);

            expect(repository.createStack).toHaveBeenCalledWith(
                mockPrismaRequest,
            );
            expect(repository.createStack).toHaveBeenCalledTimes(1);
        });
    });

    describe('getAllStacks', (): void => {
        it('should return a list of stacks', async (): Promise<void> => {
            jest.spyOn(repository, 'findAll').mockResolvedValue(mockStacks);

            const result = await stackService.getAllStacks();

            expect(result).toEqual(
                mockStacks.map((stack) => new GetStackResponse(stack)),
            );
            expect(repository.findAll).toHaveBeenCalledTimes(1);
        });
    });
});
