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
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { PaginationQueryDto } from '../../common/pagination/pagination.query.dto';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { CreateResumeRequest } from '../../common/dto/resumes/request/create.resume.request';
import { GetResumesQueryRequest } from '../../common/dto/resumes/request/get.resumes.query.request';
import { GetResumeResponse } from '../../common/dto/resumes/response/get.resume.response';
import { JwtAuthGuard } from '../../core/auth/jwt.guard';
import { ResumeService } from '../../core/resumes/resume.service';
import { 
    CreateResumeDoc, 
    DeleteResumeDoc, 
    GetBestResumesDoc, 
    GetResumeDoc, 
    GetResumeListDoc, 
    GetResumesByUserDoc, 
    UpdateMainResumeDoc 
} from './resume.docs';

@ApiTags('resumes')
@Controller('resumes')
export class ResumeController {
    constructor(
        private readonly resumeService: ResumeService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    @GetResumeListDoc()
    async getResumeList(
        @Query() query: GetResumesQueryRequest,
    ): Promise<GetResumeResponse[]> {
        this.logger.debug(
            `이력서 목록 조회 및 검색 요청 처리 중 - query: ${JSON.stringify(query)}`,
            ResumeController.name,
        );
        const result = await this.resumeService.getResumeList(query);
        this.logger.debug(
            `이력서 목록 조회 및 검색 요청 처리 완료`,
            ResumeController.name,
        );
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Get('/best')
    @GetBestResumesDoc()
    async getBestResumes(
        @Query() query: PaginationQueryDto,
    ): Promise<GetResumeResponse[]> {
        this.logger.debug(
            `인기 이력서 목록 조회 요청 처리 중 - query: ${JSON.stringify(query)}`,
            ResumeController.name,
        );
        const result = await this.resumeService.getBestResumes(query);
        this.logger.debug(
            `인기 이력서 목록 조회 요청 처리 완료`,
            ResumeController.name,
        );
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    @UseInterceptors(FileInterceptor('file')) // 파일 업로드 처리
    @ApiConsumes('multipart/form-data') // Swagger에서 파일 업로드 지원
    @CreateResumeDoc()
    async createResume(
        @Req() request: any,
        @UploadedFile() file: Express.Multer.File, // 파일 데이터
        @Body() body: CreateResumeRequest, // 요청 데이터
    ): Promise<GetResumeResponse> {
        const user = request.user;
        this.logger.debug(
            `이력서 생성 요청 처리 중 - userId: ${user.id}, body: ${JSON.stringify(body)}, file: ${file.originalname}`,
            ResumeController.name,
        );
        const result = await this.resumeService.createResume(body, file, user);
        this.logger.debug(`이력서 생성 요청 처리 완료`, ResumeController.name);
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Get(':resumeId')
    @GetResumeDoc()
    async getResume(
        @Param('resumeId', ParseIntPipe) resumeId: number,
    ): Promise<GetResumeResponse> {
        this.logger.debug(
            `단일 이력서 조회 요청 처리 중 - resumeId: ${resumeId}`,
            ResumeController.name,
        );
        const result = await this.resumeService.getResume(resumeId);
        this.logger.debug(
            `단일 이력서 조회 요청 처리 완료`,
            ResumeController.name,
        );
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Get('/user/:userId')
    @GetResumesByUserDoc()
    async getResumesByUser(
        @Param('userId') userId: number,
        @Query() query: PaginationQueryDto,
    ): Promise<GetResumeResponse[]> {
        this.logger.debug(
            `유저 별 이력서 목록 조회 요청 처리 중 - userId: ${userId}, query: ${JSON.stringify(query)}`,
            ResumeController.name,
        );
        const result = await this.resumeService.getResumesByUser(userId, query);
        this.logger.debug(
            `유저 별 이력서 목록 조회 요청 처리 완료`,
            ResumeController.name,
        );
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':resumeId')
    @DeleteResumeDoc()
    async deleteResume(
        @Req() request: Request,
        @Param('resumeId', ParseIntPipe) resumeId: number,
    ): Promise<void> {
        const user = request.user as any;
        this.logger.debug(
            `이력서 삭제 요청 처리 중 - userId: ${user.id}, resumeId: ${resumeId}`,
            ResumeController.name,
        );
        const result = await this.resumeService.deleteResume(user, resumeId);
        this.logger.debug(`이력서 삭제 요청 처리 완료`, ResumeController.name);
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':resumeId')
    @UpdateMainResumeDoc()
    async updateMainResume(
        @Req() request: any,
        @Param('resumeId', ParseIntPipe) resumeId: number,
    ): Promise<void> {
        const user = request.user as any;
        this.logger.debug(
            `메인 이력서 지정 요청 처리 중 - userId: ${user.id}, resumeId: ${resumeId}`,
            ResumeController.name,
        );
        await this.resumeService.updateMainResume(user, resumeId);
        this.logger.debug(
            `메인 이력서 지정 요청 처리 완료`,
            ResumeController.name,
        );
    }
}
