import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsUrl } from 'class-validator';

export class UpdateBlogRequest {
    @IsString()
    @ApiProperty({
        example: '[Recoil] 상태관리란',
        description: '게시물 제목',
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
        example: '2024-09-12T08:00:00Z',
        description: '게시 일자',
    })
    readonly date: Date;
}
