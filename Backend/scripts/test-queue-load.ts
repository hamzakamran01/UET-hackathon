import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { TokensService } from '../src/tokens/tokens.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const tokensService = app.get(TokensService);
    const prisma = app.get(PrismaService);

    console.log('Starting Queue Load Test...');

    // 1. Create Test Service
    const service = await prisma.service.create({
        data: {
            name: 'Load Test Service ' + Date.now(),
            latitude: 0,
            longitude: 0,
        },
    });
    console.log(`Created service: ${service.name}`);

    // 2. Create Test User
    const user = await prisma.user.create({
        data: {
            email: `test${Date.now()}@example.com`,
            phone: `+1${Date.now()}`,
        },
    });

    // 3. Generate 600 Tokens
    console.log('Generating 600 tokens...');
    const data = [];
    for (let i = 0; i < 600; i++) {
        data.push({
            tokenNumber: `T-${i}`,
            queuePosition: i + 1,
            userId: user.id,
            serviceId: service.id,
            status: 'ACTIVE',
        });
    }
    await prisma.token.createMany({ data: data as any });
    console.log('Tokens generated.');

    // 4. Measure Performance
    console.log('Fetching tokens...');
    const start = Date.now();
    const tokens = await tokensService.findByService(service.id);
    const duration = Date.now() - start;

    console.log(`Fetched ${tokens.length} tokens in ${duration}ms`);

    if (tokens.length === 500 && duration < 1000) {
        console.log('✅ TEST PASSED: Limited to 500 tokens and fast response.');
    } else {
        console.error('❌ TEST FAILED: Unexpected result.');
        console.log(`Count: ${tokens.length}, Duration: ${duration}ms`);
    }

    // Cleanup
    await prisma.service.delete({ where: { id: service.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await app.close();
}

bootstrap();
