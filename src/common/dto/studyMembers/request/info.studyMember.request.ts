import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';
export class StudyMemberInfoRequest {
    @IsNotEmpty()
    @IsNumber()
    @ApiProperty({
        description: '사용자 ID',
        example: 1,
    })
    userId: number;

    @IsNotEmpty()
    @IsBoolean()
    @ApiProperty({
        description: '리더 여부',
        example: true,
    })
    isLeader: boolean;
}
