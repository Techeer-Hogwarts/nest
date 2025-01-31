import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
    Req,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Patch,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { CreateResumeRequest } from './dto/request/create.resume.request';
import { GetResumeResponse } from './dto/response/get.resume.response';
import { ResumeService } from './resume.service';
import { GetResumesQueryRequest } from './dto/request/get.resumes.query.request';
import { PaginationQueryDto } from '../../global/pagination/pagination.query.dto';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

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

    @UseGuards(JwtAuthGuard)
    @Post()
    @UseInterceptors(FileInterceptor('file')) // 파일 업로드 처리
    @ApiConsumes('multipart/form-data') // Swagger에서 파일 업로드 지원
    @ApiOperation({
        summary: '이력서 생성',
        description: '파일과 폼 데이터를 사용해 이력서를 생성합니다.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary', // 파일 필드
                    description: '업로드할 파일',
                },
                category: {
                    type: 'string',
                    example: 'PORTFOLIO',
                    description: '이력서 타입',
                },
                position: {
                    type: 'string',
                    example: 'BACKEND',
                    description: '이력서 포지션',
                },
                title: {
                    type: 'string',
                    example: '스타트업',
                    description: '이력서 제목',
                },
                isMain: {
                    type: 'boolean',
                    example: true,
                    description: '이력서 대표 여부',
                },
            },
            required: ['file', 'category', 'position', 'title', 'isMain'], // 필수 필드
        },
    })
    async createResume(
        @Req() request: any,
        @UploadedFile() file: Express.Multer.File, // 파일 데이터
        @Body() body: CreateResumeRequest, // 요청 데이터
    ): Promise<any> {
        const user = request.user;

        // 파일과 요청 데이터를 서비스로 전달
        const resume = await this.resumeService.createResume(body, file, user);

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

    @UseGuards(JwtAuthGuard)
    @Delete(':resumeId')
    @ApiOperation({
        summary: '이력서 삭제',
        description: '지정된 ID의 이력서를 삭제합니다.',
    })
    async deleteResume(
        @Req() request: Request,
        @Param('resumeId', ParseIntPipe) resumeId: number,
    ): Promise<any> {
        const user = request.user as any;
        await this.resumeService.deleteResume(user, resumeId);
        return {
            code: 200,
            message: '이력서가 삭제되었습니다.',
        };
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':resumeId')
    @ApiOperation({
        summary: '메인 이력서 지정',
        description:
            '사용자가 올린 이력서들 중 메인으로 표시할 이력서를 변경합니다.',
    })
    async updateMainResume(
        @Req() request: any,
        @Param('resumeId', ParseIntPipe) resumeId: number,
    ): Promise<any> {
        const user = request.user as any;
        await this.resumeService.updateMainResume(user, resumeId);
        return {
            code: 200,
            message: '메인 이력서를 변경했습니다.',
        };
    }
}
