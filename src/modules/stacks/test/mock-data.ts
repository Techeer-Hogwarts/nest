import { StackCategory } from '../../../global/category/stack.category';
import { CreateStacksRequest } from '../dto/request/post.stack.request';
import { StackCategory as PrismaStackCategory } from '@prisma/client';

export const mockRequest: CreateStacksRequest = {
    category: StackCategory.BACKEND,
    name: 'NestJS',
};
export const mockPrismaRequest = {
    category: PrismaStackCategory[StackCategory.BACKEND],
    name: 'NestJS',
};
