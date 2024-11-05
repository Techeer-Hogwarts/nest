import { ApiProperty } from '@nestjs/swagger';
import { EventCategory } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateEventRequest {
    @IsEnum(EventCategory)
    @ApiProperty({
        example: 'TECHEER',
        description: '카테고리',
    })
    readonly category: EventCategory;

    @IsString()
    @ApiProperty({
        example: '테커 파티',
        description: '행사 이름',
    })
    readonly title: string;

    @IsDateString()
    @ApiProperty({
        example: '2024-09-12T08:00:00Z',
        description: '시작 날짜',
    })
    readonly startDate: Date;

    @IsOptional()
    @IsDateString()
    @ApiProperty({
        example: '2024-09-13T08:00:00Z',
        description: '종료 날짜',
    })
    readonly endDate?: Date;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'https://example.com',
        description: '링크',
    })
    readonly url?: string;
}
