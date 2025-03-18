import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from './infra/prisma/prisma.service';
import * as cookieParser from 'cookie-parser';
import { GlobalExceptionsFilter } from './common/exception/global-exception.filter';
import * as basicAuth from 'express-basic-auth';
import { CustomWinstonLogger } from './common/logger/winston.logger';

async function bootstrap(): Promise<void> {
    try {
        const app = await NestFactory.create(AppModule, {
            cors: {
                origin: (origin, callback) => {
                    const allowedDomainPatterns = [
                        /^https:\/\/.*-techeerzip\.vercel\.app$/,
                        /^https:\/\/www\.techeerzip\.cloud$/,
                        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/, // localhost와 127.0.0.1의 모든 포트 허용
                        /^null$/,
                        /^https:\/\/api\.techeerzip\.cloud$/,
                        /^https:\/\/(?:.*\.)?yje\.kr$/,
                    ];

                    if (
                        !origin ||
                        allowedDomainPatterns.some((pattern) =>
                            pattern.test(origin),
                        )
                    ) {
                        callback(null, true);
                    } else {
                        callback(new Error('Not allowed by CORS'));
                    }
                },
                methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
                preflightContinue: false,
                optionsSuccessStatus: 204,
                credentials: true,
            },
        });
        // CustomWinstonLogger 인스턴스 가져오기
        const customLogger = app.get(CustomWinstonLogger);

        // 인스턴스 전달
        app.useLogger(customLogger);

        // cookie-parser 미들웨어 추가
        app.use(cookieParser());

        app.setGlobalPrefix('api/v1');
        customLogger.log('Global prefix를 "api/v1"로 설정했습니다.');

        // Basic Auth 미들웨어 추가
        app.use(
            ['/api/v1/docs'], // Swagger 경로에 대한 Basic Auth 적용
            basicAuth({
                users: {
                    [process.env.SWAGGER_USER]: process.env.SWAGGER_PASSWORD,
                },

                challenge: true,
            }),
        );

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

        customLogger.debug('Swagger 옵션이 성공적으로 생성되었습니다.');

        const document = SwaggerModule.createDocument(app, options);

        // Swagger 캐시 방지
        app.use('/api/v1/docs', (req, res, next) => {
            res.setHeader(
                'Cache-Control',
                'no-store, no-cache, must-revalidate, proxy-revalidate',
            );
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            next();
        });

        SwaggerModule.setup('api/v1/docs', app, document);

        customLogger.log('Swagger 모듈 설정이 완료되었습니다.');

        app.useGlobalPipes(
            new ValidationPipe({
                transform: true, // DTO에서 정의한 타입으로 자동 변환
                forbidNonWhitelisted: true, // DTO에 없는 값이 들어오면 예외 발생
            }),
        );
        customLogger.log('Global validation 파이프가 설정되었습니다.');

        const prismaService = app.get(PrismaService);
        let retries = 5;
        const retryDelay = 5000;

        while (retries) {
            try {
                await prismaService.$connect();
                customLogger.log('데이터베이스에 성공적으로 연결되었습니다.');
                break;
            } catch (err) {
                retries -= 1;
                customLogger.warn(
                    `데이터베이스 연결에 실패했습니다. 남은 재시도 횟수: ${retries}`,
                );
                customLogger.debug(`에러 스택 트레이스: ${err.stack}`);
                if (retries === 0) {
                    customLogger.error(
                        '모든 재시도가 실패했습니다. 프로세스를 종료합니다.',
                    );
                    process.exit(1);
                }
                await new Promise((res) => setTimeout(res, retryDelay));
            }
        }

        app.useGlobalFilters(new GlobalExceptionsFilter());

        await app.listen(8000);
        customLogger.log('애플리케이션이 포트 8000에서 작동 중입니다.');
    } catch (error) {
        process.exit(1);
    }
}
bootstrap();
