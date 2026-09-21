import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request } from 'express';

import { AppModule } from './app.module';
import { ElapsedTimeInterceptor } from './shared/elapsed-time.interceptor';
import { DomainExceptionFilter } from './shared/errors/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // поля, не описанные в DTO, отбрасываются
      transform: true, // тело запроса приходит в контроллер уже экземпляром DTO-класса
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());
  app.useGlobalInterceptors(new ElapsedTimeInterceptor());

  const openApi = new DocumentBuilder()
    .setTitle('RunSocial API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, openApi), {
    // за nginx API живёт под /api, иначе «Try it out» шлёт запросы мимо префикса
    patchDocumentOnRequest: (req, _res, document) => ({
      ...document,
      servers: [{ url: (req as Request).get('x-forwarded-prefix') ?? '/' }],
    }),
  });

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
  Logger.log(`API запущен на http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
