import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from './modules/prisma/prisma.service';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule, {
        cors: {
            origin: true,
            methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
            preflightContinue: false,
            optionsSuccessStatus: 204,
            credentials: true,
        },
    });

    app.setGlobalPrefix('api/v1');
    const options = new DocumentBuilder()
        .setTitle('Goodnight Hackathon')
        .setDescription('API description')
        .setVersion('1.0')
        .addTag('wishes')
        .addTag('comments')
        .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('docs', app, document);

    app.useGlobalPipes(new ValidationPipe());

    const prismaService = app.get(PrismaService);
    let retries = 5;
    const retryDelay = 5000;

    while (retries) {
        try {
            await prismaService.$connect();
            break;
        } catch (err) {
            retries -= 1;
            await new Promise((res) => setTimeout(res, retryDelay));
        }
    }

    if (retries === 0) {
        process.exit(1);
    }
    await app.listen(8000);
}
bootstrap();
