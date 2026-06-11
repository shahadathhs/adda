process.env.SKIP_DB = 'true';
process.env.DATABASE_URL =
  'postgresql://placeholder:placeholder@localhost:5432/placeholder';

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import yaml from 'js-yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function generateSpec() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('Adda API')
    .setDescription('Adda API Documentation')
    .setVersion('0.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outputPath = resolve(root, '../../packages/api-spec/openapi.yaml');
  const yamlContent = yaml.dump(document, { noRefs: true });
  writeFileSync(outputPath, yamlContent, 'utf-8');

  console.log(`OpenAPI spec generated at ${outputPath}`);
  await app.close();
}

generateSpec().catch((err) => {
  console.error(err);
  process.exit(1);
});
