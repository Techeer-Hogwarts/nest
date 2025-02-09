import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateBookmarkRequest } from './dto/request/create.bookmark.request';
import { GetBookmarkResponse } from './dto/response/get.bookmark.response';
import { GetBookmarkListRequest } from './dto/request/get.bookmark-list.request';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { GetSessionResponse } from '../sessions/dto/response/get.session.response';
import { GetBlogResponse } from '../blogs/dto/response/get.blog.response';
import { GetResumeResponse } from '../resumes/dto/response/get.resume.response';

@ApiTags('bookmark')
@Controller('/bookmark')
export class BookmarkController {
    constructor(private readonly bookmarkService: BookmarkService) {}

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
        const userId = user.id;
        return this.bookmarkService.toggleBookmark(
            createBookmarkRequest,
            userId,
        );
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
    ): Promise<GetSessionResponse[] | GetBlogResponse[] | GetResumeResponse[]> {
        const user = request.user as any;
        return this.bookmarkService.getBookmarkList(
            user.id,
            getBookmarkListRequest,
        );
    }
}
