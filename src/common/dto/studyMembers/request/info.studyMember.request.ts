import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
export class StudyMemberInfoRequest {
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
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
