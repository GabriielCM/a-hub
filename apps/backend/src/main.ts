import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // Configuração HTTPS para desenvolvimento local
  const httpsOptions =
    process.env.HTTPS_ENABLED === 'true' &&
    process.env.HTTPS_KEY_PATH &&
    process.env.HTTPS_CERT_PATH
      ? {
          key: fs.readFileSync(path.resolve(process.env.HTTPS_KEY_PATH)),
          cert: fs.readFileSync(path.resolve(process.env.HTTPS_CERT_PATH)),
        }
      : undefined;

  const app = await NestFactory.create(AppModule, { httpsOptions });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS for frontend and mobile development
  const allowedOrigins: (string | RegExp)[] = [
    'https://localhost:3000',
    /^https:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  ];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;

  // Listen on all interfaces for mobile access
  await app.listen(port, '0.0.0.0');

  const protocol = httpsOptions ? 'https' : 'http';
  console.log(`Application is running on: ${protocol}://localhost:${port}/api`);
  console.log(
    `For mobile access use: ${protocol}://YOUR_LOCAL_IP:${port}/api`,
  );
}
bootstrap();
