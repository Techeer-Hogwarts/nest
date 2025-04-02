// import { StackCategory } from '../../../common/category/stack.category';
// import { CreateStacksRequest } from '../dto/request/post.stack.request';
// import { StackCategory as PrismaStackCategory } from '@prisma/client';
// import { StackEntity } from '../entities/stack.entity';
// import { GetStackResponse } from '../dto/response/get.stack.response';

// export const mockRequest: CreateStacksRequest = {
//     category: StackCategory.BACKEND,
//     name: 'NestJS',
// };
// export const mockPrismaRequest = {
//     category: PrismaStackCategory[StackCategory.BACKEND],
//     name: 'NestJS',
// };

// export const mockStacks: StackEntity[] = [
//     {
//         id: 1,
//         name: 'React.js',
//         category: StackCategory.FRONTEND,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         isDeleted: false,
//     },
//     {
//         id: 2,
//         name: 'Vue.js',
//         category: StackCategory.FRONTEND,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         isDeleted: false,
//     },
//     {
//         id: 3,
//         name: 'Next.js',
//         category: StackCategory.FRONTEND,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         isDeleted: false,
//     },
// ];

// export const mockGetStackResponses: GetStackResponse[] = mockStacks.map(
//     (stack) => new GetStackResponse(stack),
// );
