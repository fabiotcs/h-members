import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import * as path from 'path';
import { AppModule } from './app.module';
import { AppConfigService } from './config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  const appConfig = app.get(AppConfigService);

  // Cookie parser (required for JWT cookie extraction)
  app.use(cookieParser());

  // Serve uploaded files as static assets under /uploads
  const uploadDir = path.resolve(appConfig.storage.uploadDir);
  app.useStaticAssets(uploadDir, { prefix: '/uploads' });

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: appConfig.app.corsOrigin,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('H-Members API')
    .setDescription('API for the H-Members membership platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('access_token')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // SMTP warning
  if (!appConfig.isMailConfigured) {
    logger.warn(
      'SMTP is not fully configured. Email sending will be unavailable.',
    );
  }

  const port = appConfig.app.port;
  await app.listen(port);
  logger.log(`H-Members API running on http://localhost:${port}`);
  logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
