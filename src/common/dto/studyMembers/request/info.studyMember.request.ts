import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty } from 'class-validator';

export class StudyMemberInfoRequest {
    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    @ApiProperty({
        description: '사용자 ID',
        example: 1,
    })
    userId: number;

    @IsNotEmpty()
    @Type(() => Boolean)
    @IsBoolean()
    @ApiProperty({
        description: '리더 여부',
        example: true,
    })
    isLeader: boolean;
}
