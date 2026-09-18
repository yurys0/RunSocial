import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
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

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
  Logger.log(`API запущен на http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
