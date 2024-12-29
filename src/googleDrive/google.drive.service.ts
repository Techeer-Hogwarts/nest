import { Injectable } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleDriveService {
    private driveClient: drive_v3.Drive;

    constructor(private configService: ConfigService) {
        console.log('Initializing Google Drive Service...');
        this.initializeDriveClient();
    }

    private async initializeDriveClient(): Promise<void> {
        // ConfigService를 사용해 환경 변수 가져오기
        const credentials = {
            type: this.configService.get<string>('GOOGLE_AUTH_TYPE'),
            project_id: this.configService.get<string>(
                'GOOGLE_AUTH_PROJECT_ID',
            ),
            private_key_id: this.configService.get<string>(
                'GOOGLE_AUTH_PRIVATE_KEY_ID',
            ),
            private_key: this.configService
                .get<string>('GOOGLE_AUTH_PRIVATE_KEY')
                ?.replace(/\\n/g, '\n'), // 줄바꿈 처리
            client_email: this.configService.get<string>(
                'GOOGLE_AUTH_CLIENT_EMAIL',
            ),
            client_id: this.configService.get<string>('GOOGLE_AUTH_CLIENT_ID'),
        };

        // 인증 정보 검증
        if (!credentials.private_key || !credentials.client_email) {
            throw new Error('Invalid or missing Google Auth credentials');
        }

        // Google Auth 초기화
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const authClient = (await auth.getClient()) as any;

        // Google Drive 클라이언트 초기화
        this.driveClient = google.drive({
            version: 'v3',
            auth: authClient,
        });

        console.log('Google Drive Service initialized successfully.');
    }

    private bufferToStream(buffer: Buffer): Readable {
        const readable = new Readable();
        readable.push(buffer);
        readable.push(null); // 스트림 종료
        return readable;
    }

    public async uploadFileBuffer(
        fileBuffer: Buffer,
        fileName: string,
        folderId: string,
    ): Promise<string> {
        try {
            const fileMetadata = {
                name: fileName,
                parents: [folderId],
            };

            const media = {
                mimeType: 'application/pdf', // 필요한 MIME 타입으로 변경 가능
                body: this.bufferToStream(fileBuffer),
            };

            const response = await this.driveClient.files.create({
                requestBody: fileMetadata,
                media,
                fields: 'id,webViewLink',
            });

            return response.data.webViewLink || '';
        } catch (error) {
            console.error('Error uploading file to Google Drive:', error);
            throw error;
        }
    }
}
