import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateResumeRequest } from './dto/request/create.resume.request';
import { GetResumeResponse } from './dto/response/get.resume.response';
import { ResumeService } from './resume.service';

@ApiTags('resumes')
@Controller('resumes')
export class ResumeController {
    constructor(private readonly resumeService: ResumeService) {}

    @Post(':userId') // JWT 토큰 이전 임시 파라미터
    @ApiOperation({
        summary: '이력서 생성',
        description: '새로운 이력서를 생성합니다.',
    })
    async createResume(
        @Param('userId', ParseIntPipe) userId: number,
        @Body() createResumeRequest: CreateResumeRequest,
    ): Promise<any> {
        const resume: GetResumeResponse = await this.resumeService.createResume(
            userId,
            createResumeRequest,
        );
        return {
            code: 201,
            message: '이력서를 생성했습니다.',
            data: resume,
        };
    }
}
