import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateBookmarkRequest } from './dto/request/create.bookmark.request';
import { GetBookmarkResponse } from './dto/response/get.bookmark.response';
import { GetBookmarkListRequest } from './dto/request/get.bookmark-list.request';

@ApiTags('bookmark')
@Controller('/bookmark')
export class BookmarkController {
    constructor(private readonly bookmarkService: BookmarkService) {}

    @Post('')
    @ApiOperation({
        summary: '북마크 생성 및 설정 변경',
        description: '북마크를 저장 혹은 설정을 변경합니다.',
    })
    async createBookmark(
        @Body() createBookmarkRequest: CreateBookmarkRequest,
    ): Promise<any> {
        const content: GetBookmarkResponse =
            await this.bookmarkService.toggleBookmark(createBookmarkRequest);
        return {
            code: 201,
            message: '북마크 설정을 변경했습니다.',
            data: content,
        };
    }

    @Get('/:userId')
    @ApiOperation({
        summary: '유저 별 북마크 목록 조회',
        description: '유저별 북마크한 콘텐츠 목록을 조회합니다.',
    })
    async getBookmark(
        @Param('userId', ParseIntPipe) userId: number,
        @Query() getBookmarkListRequest: GetBookmarkListRequest,
    ): Promise<any> {
        const contents = await this.bookmarkService.getBookmark(
            userId,
            getBookmarkListRequest,
        );
        return {
            code: 200,
            message: '북마크 목록을 조회했습니다.',
            data: contents,
        };
    }
}
