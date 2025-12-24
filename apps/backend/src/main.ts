import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS for frontend and mobile development
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://localhost:3000',
      /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
    ],
    credentials: true,
  });

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;

  // Listen on all interfaces for mobile access
  await app.listen(port, '0.0.0.0');

  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`For mobile access use: http://YOUR_LOCAL_IP:${port}/api`);
}
bootstrap();
