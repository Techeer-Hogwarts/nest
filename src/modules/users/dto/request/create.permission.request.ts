import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreatePermissionRequest {
    @IsNumber()
    @ApiProperty({
        example: 2,
        description: '요청한 권한 ID',
    })
    readonly roleId: number;
}
