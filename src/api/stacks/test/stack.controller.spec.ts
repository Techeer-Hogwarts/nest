// import { Test, TestingModule } from '@nestjs/testing';
// import { StackController } from '../stack.controller';
// import { StackService } from '../stack.service';
// import { CustomWinstonLogger } from '../../../common/logger/winston.logger';
// import { mockGetStackResponses, mockRequest } from './mock-data';

// describe('StackController', () => {
//     let controller: StackController;
//     let service: StackService;

//     beforeEach(async () => {
//         const module: TestingModule = await Test.createTestingModule({
//             controllers: [StackController],
//             providers: [
//                 {
//                     provide: StackService,
//                     useValue: {
//                         createStack: jest.fn(),
//                         getAllStacks: jest.fn(),
//                     },
//                 },
//                 {
//                     provide: CustomWinstonLogger,
//                     useValue: {
//                         debug: jest.fn(),
//                         error: jest.fn(),
//                     },
//                 },
//             ],
//         }).compile();

//         controller = module.get<StackController>(StackController);
//         service = module.get<StackService>(StackService);
//     });

//     it('should be defined', (): void => {
//         expect(controller).toBeDefined();
//     });

//     describe('createStack', (): void => {
//         it('should add new Stack', async (): Promise<void> => {
//             jest.spyOn(service, 'createStack').mockResolvedValue(undefined);
//             const result = await controller.createStack(mockRequest);
//             expect(result).toBeUndefined();
//             expect(service.createStack).toHaveBeenCalledWith(mockRequest);
//             expect(service.createStack).toHaveBeenCalledTimes(1);
//         });
//     });

//     describe('getAllStacks', (): void => {
//         it('should return all stacks', async (): Promise<void> => {
//             jest.spyOn(service, 'getAllStacks').mockResolvedValue(
//                 mockGetStackResponses,
//             );

//             const result = await controller.getAllStacks();

//             expect(result).toEqual(mockGetStackResponses);
//             expect(service.getAllStacks).toHaveBeenCalledTimes(1);
//         });
//     });
// });
