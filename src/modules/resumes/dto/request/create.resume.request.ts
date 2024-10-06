import { ApiProperty } from '@nestjs/swagger';
import { ResumeType } from '@prisma/client';

export class CreateResumeRequest {
    @ApiProperty({
        example: 'https://example.com/resume.pdf',
        description: '이력서 파일 URL',
    })
    readonly url: string;

    @ApiProperty({
        example: 'User Resume',
        description: '이력서 제목',
    })
    readonly title: string;

    @ApiProperty({
        example: 'PORTFOLIO',
        description: '이력서 타입',
    })
    readonly ResumeType: ResumeType;
}
