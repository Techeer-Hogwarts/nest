import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Request } from 'express';

import { GetLikeListDoc, PostLikeDoc } from './like.docs';

import { GetBlogResponse } from '../../common/dto/blogs/response/get.blog.response';
import { CreateLikeRequest } from '../../common/dto/likes/request/create.like.request';
import { GetLikeListRequest } from '../../common/dto/likes/request/get.like-list.request';
import { GetLikeResponse } from '../../common/dto/likes/response/get.like.response';
import { GetProjectTeamListResponse } from '../../common/dto/projectTeams/response/get.projectTeamList.response';
import { GetResumeResponse } from '../../common/dto/resumes/response/get.resume.response';
import { GetSessionResponse } from '../../common/dto/sessions/response/get.session.response';
import { GetStudyTeamListResponse } from '../../common/dto/studyTeams/response/get.studyTeamList.response';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { JwtAuthGuard } from '../../core/auth/jwt.guard';
import { LikeService } from '../../core/likes/like.service';

import { JwtAuthGuard } from '../../core/auth/jwt.guard';
import { LikeService } from '../../core/likes/like.service';

@ApiTags('likes')
@Controller('/likes')
export class LikeController {
    constructor(
        private readonly likeService: LikeService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post('')
    @PostLikeDoc()
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
    @GetLikeListDoc()
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
