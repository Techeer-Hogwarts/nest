import { IsString, IsNumber, IsUrl, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BlogDomain {
    @IsNumber()
    @ApiProperty({
        example: 1,
        description: '작성자 아이디',
    })
    readonly userId: number;

    @IsString()
    @ApiProperty({
        example: '[Redis] 레디스의 TTL',
        description: '제목',
    })
    readonly title: string;

    @IsUrl()
    @ApiProperty({
        example: 'https://example.com/blog',
        description: '원문 url',
    })
    readonly url: string;

    @IsDateString()
    @ApiProperty({
        example: '2023-09-12T08:00:00Z',
        description: '게시 일자',
    })
    readonly date: Date;

    @IsString()
    @ApiProperty({
        example: 'Backend',
        description: '카테고리',
    })
    readonly category: string;
}
