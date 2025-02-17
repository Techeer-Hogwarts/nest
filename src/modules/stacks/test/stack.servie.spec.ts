import { Test, TestingModule } from '@nestjs/testing';
import { StackService } from '../stack.service';
import { StackRepository } from '../repository/stack.repository';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';
import { mockRequest, mockPrismaRequest } from './mock-data';

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
});
