import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsString } from 'class-validator';

import { StackCategory } from '@prisma/client';

export class CreateStacksRequest {
    @ApiProperty({ enum: StackCategory })
    @IsEnum(StackCategory)
    readonly category: StackCategory;

    @ApiProperty({ type: String })
    @IsString()
    readonly name: string;
}
