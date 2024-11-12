import { stackCategory, Stack } from '@prisma/client';
export class StackEntity implements Stack {
    name: string;
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    stack: string;
    category: stackCategory;
}
