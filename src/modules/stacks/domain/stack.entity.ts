import { $Enums, Stack } from '@prisma/client';
export class StackEntity implements Stack {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    stack: string;
    category: $Enums.stackCategory;
}
