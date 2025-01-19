import { Injectable, Logger } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';
import { OnModuleInit } from '@nestjs/common';

@Injectable()
export class GoogleDriveService implements OnModuleInit {
    private driveClient: drive_v3.Drive;

    constructor(private configService: ConfigService) {}

    async onModuleInit(): Promise<void> {
        await this.initializeDriveClient();
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

        Logger.log('Google Drive Service initialized successfully.');
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
    ): Promise<string> {
        try {
            const folderId = this.configService.get<string>('GOOGLE_FOLDER_ID');

            if (!folderId) {
                throw new Error('Google Drive folder ID is not configured');
            }

            const fileMetadata = {
                name: fileName,
                parents: [folderId], // 환경변수에서 가져온 폴더 ID 사용
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
            Logger.error('Error uploading file to Google Drive:', error);
            throw error;
        }
    }

    public async moveFileToArchive(fileName: string): Promise<void> {
        try {
            // 아카이브 폴더 ID와 원본 폴더 ID 가져오기
            const archiveFolderId =
                this.configService.get<string>('ARCHIVE_FOLDER_ID');
            const sourceFolderId =
                this.configService.get<string>('GOOGLE_FOLDER_ID');

            // 파일 이름으로 파일 ID 검색
            const response = await this.driveClient.files.list({
                q: `name='${fileName}' and '${sourceFolderId}' in parents`,
                fields: 'files(id, name)',
                spaces: 'drive',
            });

            const files = response.data.files;

            if (!files || files.length === 0) {
                throw new Error(
                    `File "${fileName}" not found in folder "${sourceFolderId}".`,
                );
            }

            const fileId = files[0].id; // 첫 번째 검색 결과의 파일 ID

            // 파일 이동
            await this.driveClient.files.update({
                fileId,
                addParents: archiveFolderId,
                removeParents: sourceFolderId,
                fields: 'id, parents',
            });

            Logger.log(
                `File "${fileName}" (ID: ${fileId}) moved to archive folder.`,
            );
        } catch (error) {
            Logger.error('Error moving file to archive folder:', error);
            throw error;
        }
    }
}
