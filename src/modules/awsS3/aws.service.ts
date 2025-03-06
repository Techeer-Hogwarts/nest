import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { VALID_IMAGE_EXTENSIONS } from './aws.valid-extentions';
import { NotApprovedFileExtension } from '../../global/exception/custom.exception';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';

@Injectable()
export class AwsService {
    s3Client: S3Client;

    constructor(
        private configService: ConfigService,
        private readonly logger: CustomWinstonLogger,
    ) {
        // AWS S3 클라이언트 초기화. 환경 설정 정보를 사용하여 AWS 리전, Access Key, Secret Key를 설정.
        this.s3Client = new S3Client({
            region: this.configService.get('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.get('AWS_S3_ACCESS_KEY'),
                secretAccessKey: this.configService.get(
                    'AWS_S3_SECRET_ACCESS_KEY',
                ),
            },
        });
    }

    async imageUploadToS3(
        folderPath: string, // 업로드할 폴더 경로 (예: 'images/profile')
        fileName: string, // 업로드될 파일의 이름
        file: Express.Multer.File, // 업로드할 파일
        ext: string, // 파일 확장자
    ): Promise<string> {
        // AWS S3에 이미지 업로드 명령을 생성합니다. 파일 이름, 파일 버퍼, 파일 접근 권한, 파일 타입 등을 설정합니다.
        const keyPath = `${folderPath}/${fileName}`; // 폴더 경로와 파일명을 결합
        const command = new PutObjectCommand({
            Bucket: this.configService.get('AWS_S3_BUCKET_NAME'), // S3 버킷 이름
            Key: keyPath, // 업로드될 파일의 경로 (폴더/파일명)
            Body: file.buffer, // 업로드할 파일의 데이터 (파일 버퍼)
            ContentType: `image/${ext}`, // 파일의 MIME 타입 (image/jpeg, image/png 등)
        });

        // 생성된 명령을 S3 클라이언트에 전달하여 이미지 업로드를 수행합니다.
        await this.s3Client.send(command);

        // 업로드된 이미지의 URL을 반환합니다.
        return `https://${this.configService.get('AWS_S3_BUCKET_NAME')}.s3.${process.env.AWS_REGION}.amazonaws.com/${keyPath}`;
    }

    async uploadImagesToS3(
        files: Express.Multer.File[],
        folderName: string,
        urlPrefix: string,
    ): Promise<string[]> {
        return await Promise.all(
            files.map(async (file, index) => {
                const ext = file.originalname.split('.').pop().toLowerCase();
                if (!VALID_IMAGE_EXTENSIONS.includes(ext)) {
                    this.logger.warn(
                        `⚠️ [WARNING] 허용되지 않은 파일 확장자: ${file.originalname}`,
                    );
                    throw new NotApprovedFileExtension();
                }
                try {
                    return await this.imageUploadToS3(
                        folderName,
                        `${urlPrefix}-${Date.now()}-${index}.${ext}`,
                        file,
                        ext,
                    );
                } catch (error) {
                    this.logger.error(
                        `❌ [ERROR] 파일 업로드 실패: ${file.originalname}`,
                        error,
                    );
                    throw new error(`파일 업로드 실패: ${file.originalname}`);
                }
            }),
        );
    }
}
