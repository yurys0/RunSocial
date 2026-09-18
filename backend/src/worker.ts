import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { WorkerModule } from './worker.module';

/** Nest-контекст без HTTP: процесс живёт, пока открыто подключение BullMQ к Redis. */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  await app.init();
  Logger.log('Воркер запущен, слушает очередь синхронизации', 'Worker');
}

void bootstrap();
