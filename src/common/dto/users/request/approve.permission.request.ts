import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ApprovePermissionRequest {
    @IsNumber()
    @ApiProperty({
        example: 1,
        description: '승인할 사용자 ID',
    })
    readonly userId: number;

    @IsNumber()
    @ApiProperty({
        example: 2,
        description: '부여할 권한 ID',
    })
    readonly newRoleId: number;
}
