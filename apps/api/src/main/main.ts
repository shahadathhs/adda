import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../app.module';

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Adda API')
    .setDescription('Adda API Documentation')
    .setVersion('0.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  return { app, document };
}

async function bootstrap() {
  const { app } = await createApp();
  const port = process.env.PORT || 4000;
  await app.listen(port);
}
bootstrap();
