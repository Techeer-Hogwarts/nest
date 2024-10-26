import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';

export class UpdateEventRequest {
    @IsString()
    @ApiProperty({
        example: '채용 공고',
        description: '카테고리',
    })
    readonly category: string;

    @IsString()
    @ApiProperty({
        example: '마켓컬리',
        description: '이벤트 이름',
    })
    readonly title: string;

    @IsDateString()
    @ApiProperty({
        example: '2024-10-10T10:00:00Z',
        description: '시작 날짜',
    })
    readonly startDate: Date;

    @IsDateString()
    @ApiProperty({
        example: '2024-10-11T10:00:00Z',
        description: '종료 날짜',
    })
    readonly endDate: Date;

    @IsString()
    @ApiProperty({
        example: 'https://example.com',
        description: 'url',
    })
    readonly url: string;
}
