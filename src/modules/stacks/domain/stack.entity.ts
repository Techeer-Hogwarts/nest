import { StackCategory, Stack } from '@prisma/client';
export class StackEntity implements Stack {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    stack: string;
    category: StackCategory;
}
