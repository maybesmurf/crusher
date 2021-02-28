import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const SERVER_PORT = 4000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(SERVER_PORT);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
