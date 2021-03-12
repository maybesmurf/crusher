import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

const SERVER_PORT = 4000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Crusher API Docs')
    .setDescription('Every available crusher api is listed here with all the parameters needed to run it.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);


  await app.listen(SERVER_PORT);

  const appUrl = await app.getUrl();
  console.log('-------------------------------------------------');
  console.log(`Application is running on: ${appUrl}`);
  console.log('-------------------------------------------------');
  console.log(`API Docs are available on: ${appUrl}/api`)
  console.log('-------------------------------------------------');
}

bootstrap();
