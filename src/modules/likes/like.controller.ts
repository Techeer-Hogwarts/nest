import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { LikeService } from './like.service';
import { CreateLikeRequest } from './dto/request/create.like.request';
import { GetLikeListRequest } from './dto/request/get.like-list.request';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Request } from 'express';
import { GetLikeResponse } from './dto/response/get.like.response';
import { GetSessionResponse } from '../sessions/dto/response/get.session.response';
import { GetBlogResponse } from '../blogs/dto/response/get.blog.response';
import { GetResumeResponse } from '../resumes/dto/response/get.resume.response';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';
import { GetProjectTeamListResponse } from '../projectTeams/dto/response/get.projectTeamList.response';
import { GetStudyTeamListResponse } from '../studyTeams/dto/response/get.studyTeamList.response';

@ApiTags('likes')
@Controller('/likes')
export class LikeController {
    constructor(
        private readonly likeService: LikeService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post('')
    @ApiOperation({
        summary: '좋아요 생성 및 설정 변경',
        description:
            '좋아요를 저장 혹은 설정을 변경합니다.\n\n카테고리는 SESSION, BLOG, RESUME, PROJECT, STUDY 입니다.',
    })
    async toggleLike(
        @Req() request: Request,
        @Body() createLikeRequest: CreateLikeRequest,
    ): Promise<GetLikeResponse> {
        const user = request.user as any;
        this.logger.debug(
            `좋아요 생성 및 설정 변경 요청 처리 중 - userId: ${user.id}`,
            LikeController.name,
        );
        const result = await this.likeService.toggleLike(
            user.id,
            createLikeRequest,
        );
        this.logger.debug(
            `좋아요 생성 및 설정 변경 요청 처리 완료`,
            LikeController.name,
        );
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Get('')
    @ApiOperation({
        summary: '유저 별 좋아요 목록 조회',
        description:
            '유저 별 좋아요한 콘텐츠 목록을 조회합니다.\n\n카테고리는 SESSION, BLOG, RESUME, PROJECT, STUDY 입니다.',
    })
    async getLikeList(
        @Req() request: Request,
        @Query() getLikeListRequest: GetLikeListRequest,
    ): Promise<
        | GetSessionResponse[]
        | GetBlogResponse[]
        | GetResumeResponse[]
        | GetProjectTeamListResponse[]
        | GetStudyTeamListResponse[]
    > {
        const user = request.user as any;
        this.logger.debug(
            `유저 별 좋아요 목록 조회 요청 처리 중 - userId: ${user.id}`,
            LikeController.name,
        );
        const result = await this.likeService.getLikeList(
            user.id,
            getLikeListRequest,
        );
        this.logger.debug(
            `유저 별 좋아요 목록 조회 요청 처리 완료`,
            LikeController.name,
        );
        return result;
    }
}
