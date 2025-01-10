import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { LikeService } from './like.service';
import { CreateLikeRequest } from './dto/request/create.like.request';
import { GetLikeResponse } from './dto/response/get.like.response';
import { GetLikeListRequest } from './dto/request/get.like-list.request';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { Request } from 'express';

@ApiTags('likes')
@Controller('/likes')
export class LikeController {
    constructor(private readonly likeService: LikeService) {}

    @UseGuards(JwtAuthGuard)
    @Post('')
    @ApiOperation({
        summary: '좋아요 생성 및 설정 변경',
        description: '좋아요를 저장 혹은 설정을 변경합니다',
    })
    async toggleLike(
        @Req() request: Request,
        @Body() createLikeRequest: CreateLikeRequest,
    ): Promise<any> {
        const user = request.user as any;
        const content: GetLikeResponse = await this.likeService.toggleLike(
            user.id,
            createLikeRequest,
        );
        return {
            code: 201,
            message: '좋아요 설정을 변경했습니다.',
            data: content,
        };
    }

    @Get('/:userId')
    @ApiOperation({
        summary: '유저 별 좋아요 목록 조회',
        description: '유저 별 좋아요한 콘텐츠 목록을 조회합니다.',
    })
    async getLikeList(
        @Param('userId', ParseIntPipe) userId: number,
        @Query() getLikeListRequest: GetLikeListRequest,
    ): Promise<any> {
        const contents = await this.likeService.getLikeList(
            userId,
            getLikeListRequest,
        );

        return {
            code: 200,
            message: '좋아요 목록을 조회했습니다.',
            data: contents,
        };
    }
}
