import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';
import { LikeService } from './like.service';
import { CreateLikeRequest } from './dto/request/create.like.request';
import { GetLikeResponse } from './dto/response/get.like.response';

@ApiTags('likes')
@Controller('/likes')
export class LikeController {
    constructor(private readonly likeService: LikeService) {}

    @Post('')
    @ApiOperation({
        summary: '좋아요 생성 및 설정 변경',
        description: '좋아요를 저장 혹은 설정을 변경합니다',
    })
    async toggleLike(
        @Body() createLikeRequest: CreateLikeRequest,
    ): Promise<any> {
        const content: GetLikeResponse =
            await this.likeService.toggleLike(createLikeRequest);
        return {
            code: 201,
            message: '좋아요 설정을 변경했습니다.',
            data: content,
        };
    }
}
