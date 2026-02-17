import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    console.log('🚀 Starting application...');
    
    const app = await NestFactory.create(AppModule, {
      cors: true,
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);
    // Fly.io expects port 8080, but allow override via PORT env var
    const port = configService.get<number>('PORT', 8080);

    console.log(`📡 Configuring server on port ${port}...`);

    // Security
    app.use(helmet());

    // CORS Configuration
    app.enableCors({
      origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
      credentials: true,
    });

    // Global Validation Pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Strip unknown properties
        forbidNonWhitelisted: false, // Don't throw error, just ignore extra fields
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Global Prefix
    app.setGlobalPrefix('api');

    console.log('✅ Application configured, starting server...');
    await app.listen(port, '0.0.0.0');
    console.log(`✅ Server listening on 0.0.0.0:${port}`);
    console.log(`🌐 Health check available at http://0.0.0.0:${port}/api/health`);
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - let the app continue
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Exit only for critical errors
  if (error.message?.includes('EADDRINUSE') || error.message?.includes('port')) {
    process.exit(1);
  }
});

bootstrap().catch((error) => {
  console.error('❌ Unhandled bootstrap error:', error);
  process.exit(1);
});
