import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { PrismaService } from './modules/prisma/prisma.service';
import * as cookieParser from 'cookie-parser';

async function bootstrap(): Promise<void> {
    const logger = new Logger('Bootstrap');

    try {
        const app = await NestFactory.create(AppModule, {
            cors: {
                origin: true,
                methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
                preflightContinue: false,
                optionsSuccessStatus: 204,
                credentials: true,
            },
        });

        // cookie-parser 미들웨어 추가
        app.use(cookieParser());

        app.setGlobalPrefix('api/v1');
        logger.log('Global prefix를 "api/v1"로 설정했습니다.');

        const options = new DocumentBuilder()
            .setTitle('Techeer Zip')
            .setDescription('Techeer Zip의 API 명세입니다.')
            .setVersion('1.0')
            .addCookieAuth('access_token', {
                type: 'apiKey',
                in: 'cookie',
                name: 'access_token',
            })
            .build();

        logger.debug('Swagger 옵션이 성공적으로 생성되었습니다.');

        const document = SwaggerModule.createDocument(app, options);
        SwaggerModule.setup('docs', app, document);

        logger.log('Swagger 모듈 설정이 완료되었습니다.');

        app.useGlobalPipes(new ValidationPipe());
        logger.log('Global validation 파이프가 설정되었습니다.');

        const prismaService = app.get(PrismaService);
        let retries = 5;
        const retryDelay = 5000;

        while (retries) {
            try {
                await prismaService.$connect();
                logger.log('데이터베이스에 성공적으로 연결되었습니다.');
                break;
            } catch (err) {
                retries -= 1;
                logger.warn(
                    `데이터베이스 연결에 실패했습니다. 남은 재시도 횟수: ${retries}`,
                );
                logger.debug(`에러 스택 트레이스: ${err.stack}`);
                if (retries === 0) {
                    logger.error(
                        '모든 재시도가 실패했습니다. 프로세스를 종료합니다.',
                    );
                    process.exit(1);
                }
                await new Promise((res) => setTimeout(res, retryDelay));
            }
        }

        await app.listen(8000);
        logger.log('애플리케이션이 포트 8000에서 작동 중입니다.');
    } catch (error) {
        logger.error('애플리케이션 부트스트랩에 실패했습니다.', error.stack);
        process.exit(1);
    }
}
bootstrap();
