import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateResumeRequest } from './dto/request/create.resume.request';
import { GetResumeResponse } from './dto/response/get.resume.response';
import { ResumeService } from './resume.service';
import { GetResumesQueryRequest } from './dto/request/get.resumes.query.request';
import { PaginationQueryDto } from '../../global/common/pagination.query.dto';
import { UpdateResumeRequest } from './dto/request/update.resume.request';

@ApiTags('resumes')
@Controller('resumes')
export class ResumeController {
    constructor(private readonly resumeService: ResumeService) {}

    @Get()
    @ApiOperation({
        summary: '이력서 목록 조회 및 검색',
        description: '이력서를 조회하고 검색합니다.',
    })
    async getResumeList(@Query() query: GetResumesQueryRequest): Promise<any> {
        const resumes: GetResumeResponse[] =
            await this.resumeService.getResumeList(query);
        return {
            code: 200,
            message: '이력서 목록을 조회했습니다.',
            data: resumes,
        };
    }

    @Get('/best')
    @ApiOperation({
        summary: '인기 이력서 목록 조회',
        description:
            '(조회수 + 좋아요수*10)을 기준으로 인기 이력서를 조회합니다.',
    })
    async getBestResumes(@Query() query: PaginationQueryDto): Promise<any> {
        const resumes: GetResumeResponse[] =
            await this.resumeService.getBestResumes(query);
        return {
            code: 200,
            message: '인기 이력서를 조회했습니다.',
            data: resumes,
        };
    }

    @Post(':userId')
    @ApiOperation({
        summary: '이력서 생성',
        description: '새로운 이력서를 생성합니다.',
    })
    async createResume(
        @Param('userId') userId: number,
        @Body() createResumeRequest: CreateResumeRequest,
    ): Promise<any> {
        const resume: GetResumeResponse = await this.resumeService.createResume(
            createResumeRequest,
            userId,
        );
        return {
            code: 201,
            message: '이력서를 생성했습니다.',
            data: resume,
        };
    }

    @Get(':resumeId')
    @ApiOperation({
        summary: '단일 이력서 조회',
        description: '지정된 ID의 이력서를 조회합니다.',
    })
    async getResume(
        @Param('resumeId', ParseIntPipe) resumeId: number,
    ): Promise<any> {
        const resume: GetResumeResponse =
            await this.resumeService.getResume(resumeId);
        return {
            code: 200,
            message: '이력서를 조회했습니다.',
            data: resume,
        };
    }

    @Get('/user/:userId')
    @ApiOperation({
        summary: '유저 별 이력서 목록 조회',
        description: '지정된 유저의 이력서를 조회합니다.',
    })
    async getResumesByUser(
        @Param('userId') userId: number,
        @Query() query: PaginationQueryDto,
    ): Promise<any> {
        const resumes: GetResumeResponse[] =
            await this.resumeService.getResumesByUser(userId, query);
        return {
            code: 200,
            message: '이력서를 조회했습니다.',
            data: resumes,
        };
    }

    @Delete(':resumeId')
    @ApiOperation({
        summary: '이력서 삭제',
        description: '지정된 ID의 이력서를 삭제합니다.',
    })
    async deleteResume(
        @Param('resumeId', ParseIntPipe) resumeId: number,
    ): Promise<any> {
        await this.resumeService.deleteResume(resumeId);
        return {
            code: 200,
            message: '이력서가 삭제되었습니다.',
        };
    }

    @Patch(':resumeId')
    @ApiOperation({
        summary: '이력서 수정',
        description: '지정된 ID의 이력서 정보를 수정합니다.',
    })
    async updateResume(
        @Param('resumeId', ParseIntPipe) resumeId: number,
        @Body() updateResumeRequest: UpdateResumeRequest,
    ): Promise<any> {
        const resume: GetResumeResponse = await this.resumeService.updateResume(
            resumeId,
            updateResumeRequest,
        );
        return {
            code: 200,
            message: '이력서가 수정되었습니다.',
            data: resume,
        };
    }
}
