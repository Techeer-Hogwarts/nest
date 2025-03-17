import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { BookmarkService } from '../../core/bookmarks/bookmark.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateBookmarkRequest } from '../../common/dto/bookmarks/request/create.bookmark.request';
import { GetBookmarkResponse } from '../../common/dto/bookmarks/response/get.bookmark.response';
import { GetBookmarkListRequest } from '../../common/dto/bookmarks/request/get.bookmark-list.request';
import { Request } from 'express';
import { JwtAuthGuard } from '../../core/auth/jwt.guard';
import { GetSessionResponse } from '../../common/dto/sessions/response/get.session.response';
import { GetBlogResponse } from '../../common/dto/blogs/response/get.blog.response';
import { GetResumeResponse } from '../../common/dto/resumes/response/get.resume.response';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { GetProjectTeamListResponse } from '../../common/dto/projectTeams/response/get.projectTeamList.response';
import { GetStudyTeamListResponse } from '../../common/dto/studyTeams/response/get.studyTeamList.response';

@ApiTags('bookmarks')
@Controller('/bookmarks')
export class BookmarkController {
    constructor(
        private readonly bookmarkService: BookmarkService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post('')
    @ApiOperation({
        summary: '북마크 생성 및 설정 변경',
        description:
            '북마크를 저장 혹은 설정을 변경합니다.\n\n카테고리는 SESSION, BLOG, RESUME, PROJECT, STUDY 입니다.',
    })
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
    @ApiOperation({
        summary: '유저 별 북마크 목록 조회',
        description:
            '유저별 북마크한 콘텐츠 목록을 조회합니다.\n\n카테고리는 SESSION, BLOG, RESUME, PROJECT, STUDY 입니다.',
    })
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
