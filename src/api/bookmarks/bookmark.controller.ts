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

import { GetBookmarkListDoc, PostBookmarkDoc } from './bookmark.docs';

import { GetBlogResponse } from '../../common/dto/blogs/response/get.blog.response';
import { CreateBookmarkRequest } from '../../common/dto/bookmarks/request/create.bookmark.request';
import { GetBookmarkListRequest } from '../../common/dto/bookmarks/request/get.bookmark-list.request';
import { GetBookmarkResponse } from '../../common/dto/bookmarks/response/get.bookmark.response';
import { GetProjectTeamListResponse } from '../../common/dto/projectTeams/response/get.projectTeamList.response';
import { GetResumeResponse } from '../../common/dto/resumes/response/get.resume.response';
import { GetSessionResponse } from '../../common/dto/sessions/response/get.session.response';
import { GetStudyTeamListResponse } from '../../common/dto/studyTeams/response/get.studyTeamList.response';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { JwtAuthGuard } from '../../core/auth/jwt.guard';
import { BookmarkService } from '../../core/bookmarks/bookmark.service';

@ApiTags('bookmarks')
@Controller('/bookmarks')
export class BookmarkController {
    constructor(
        private readonly bookmarkService: BookmarkService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post('')
    @PostBookmarkDoc()
    async toggleBookmark(
        @Body() createBookmarkRequest: CreateBookmarkRequest,
        @Req() request: Request,
    ): Promise<GetBookmarkResponse> {
        const user = request.user as any;
        this.logger.debug(
            `북마크 생성 및 설정 변경 요청 처리 중 - userId: ${user.id}`,
            BookmarkController.name,
        );
        const result = await this.bookmarkService.toggleBookmark(
            createBookmarkRequest,
            user.id,
        );
        this.logger.debug(
            `북마크 생성 및 설정 변경 요청 처리 완료`,
            BookmarkController.name,
        );
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Get('')
    @GetBookmarkListDoc()
    async getBookmarkList(
        @Req() request: Request,
        @Query() getBookmarkListRequest: GetBookmarkListRequest,
    ): Promise<
        | GetSessionResponse[]
        | GetBlogResponse[]
        | GetResumeResponse[]
        | GetProjectTeamListResponse[]
        | GetStudyTeamListResponse[]
    > {
        const user = request.user as any;
        this.logger.debug(
            `유저 별 북마크 목록 조회 요청 처리 중- userId: ${user.id}`,
            BookmarkController.name,
        );
        const result = await this.bookmarkService.getBookmarkList(
            user.id,
            getBookmarkListRequest,
        );
        this.logger.debug(
            `유저 별 북마크 목록 조회 요청 처리 완료`,
            BookmarkController.name,
        );
        return result;
    }
}
