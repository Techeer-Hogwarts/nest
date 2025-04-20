import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import { GoogleDriveService } from './google.drive.service';

@ApiTags('drive')
@Controller('drive')
export class GoogleDriveController {
    constructor(private readonly googleDriveService: GoogleDriveService) {}

    @Post('upload')
    @ApiOperation({ summary: 'Upload a PDF file to Google Drive' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'PDF file upload',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                folderId: {
                    type: 'string',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
    ): Promise<{ webViewLink: string }> {
        if (!file) {
            throw new Error('No file provided');
        }
        const fileName = 'test_file';
        const webViewLink = await this.googleDriveService.uploadFileBuffer(
            file.buffer,
            fileName,
        );

        return { webViewLink };
    }
}
