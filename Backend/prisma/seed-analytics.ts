import { PrismaClient, TokenStatus, PresenceCheckType, AbuseEventType } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Configuration - Minimal data for Neon DB free tier
const DAYS_OF_HISTORY = 30; // Cover last 30 days (enough for all analytics ranges)
const TOKENS_PER_DAY_MIN = 20; // Minimal to prevent timeouts
const TOKENS_PER_DAY_MAX = 40; // Minimal to prevent timeouts

// Service Definitions
const SERVICES = [
    {
        name: 'General Consultation',
        description: 'Standard medical consultation',
        maxDailyTokens: 100,
        estimatedServiceTime: 900, // 15 mins
        prefix: 'GEN',
    },
    {
        name: 'Express Counter',
        description: 'Quick document verification and pickup',
        maxDailyTokens: 300,
        estimatedServiceTime: 300, // 5 mins
        prefix: 'EXP',
    },
    {
        name: 'VIP Support',
        description: 'Premium priority support',
        maxDailyTokens: 20,
        estimatedServiceTime: 1200, // 20 mins
        prefix: 'VIP',
    },
    {
        name: 'Lab Testing',
        description: 'Blood work and sample collection',
        maxDailyTokens: 150,
        estimatedServiceTime: 600, // 10 mins
        prefix: 'LAB',
    },
    {
        name: 'Pharmacy',
        description: 'Medicine dispensing',
        maxDailyTokens: 200,
        estimatedServiceTime: 400, // ~7 mins
        prefix: 'PHR',
    },
];

async function main() {
    console.log('🌱 Starting optimized comprehensive analytics data seeding...');
    const startTime = Date.now();

    // 1. Clean up existing analytics data (keeping admin users)
    // COMMENTED OUT: Cleanup phase causes connection timeouts with Neon DB free tier
    // To clean data manually, use Neon DB dashboard or pgAdmin
    console.log('Skipping cleanup to avoid connection timeout...');
    // await Promise.all([
    //     prisma.abuseLog.deleteMany(),
    //     prisma.presenceCheck.deleteMany(),
    //     prisma.token.deleteMany(),
    //     prisma.queueStatistics.deleteMany(),
    // ]);
    // await prisma.service.deleteMany();
    // await prisma.user.deleteMany({
    //     where: {
    //         email: {
    //             not: {
    //                 contains: 'admin'
    //             }
    //         }
    //     }
    // });

    // 2. Create Services sequentially
    console.log('Creating/updating services...');
    const services = [];
    for (const s of SERVICES) {
        const service = await prisma.service.upsert({
            where: { name: s.name },
            update: {
                description: s.description,
                isActive: true,
                maxDailyTokens: s.maxDailyTokens,
                estimatedServiceTime: s.estimatedServiceTime,
            },
            create: {
                name: s.name,
                description: s.description,
                isActive: true,
                maxDailyTokens: s.maxDailyTokens,
                estimatedServiceTime: s.estimatedServiceTime,
                latitude: 40.7128,
                longitude: -74.0060,
            },
        });
        services.push({ ...service, prefix: s.prefix });
        // Small delay to be gentle on the connection
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 3. Create Users sequentially (avoid connection pool exhaustion)
    console.log('Creating users...');
    const users = [];
    for (let i = 0; i < 10; i++) { // Reduced from 50 to 10
        const user = await prisma.user.upsert({
            where: { email: `seed-user-${i}@example.com` },
            update: {},
            create: {
                email: `seed-user-${i}@example.com`,
                phone: `+1555000${i.toString().padStart(4, '0')}`,
                emailVerified: true,
                phoneVerified: true,
                isBlocked: false,
            },
        });
        users.push(user);
    }

    // 4. Generate Tokens over History
    console.log(`Generating tokens for the last ${DAYS_OF_HISTORY} days...`);

    const now = new Date();
    let globalTokenCounter = 1000;
    const allTokenData = [];

    for (let d = DAYS_OF_HISTORY; d >= 0; d--) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);

        // Skip some Sundays
        if (date.getDay() === 0 && Math.random() > 0.3) continue;

        const dailyVolume = faker.number.int({ min: TOKENS_PER_DAY_MIN, max: TOKENS_PER_DAY_MAX });
        const serviceTokenCounters: { [key: string]: number } = {};

        for (const svc of services) {
            serviceTokenCounters[svc.id] = 0;
        }

        for (let i = 0; i < dailyVolume; i++) {
            const service = faker.helpers.arrayElement(services);
            const user = faker.helpers.arrayElement(users);

            serviceTokenCounters[service.id]++;

            // Peak hours logic
            let hour = 9;
            const rand = Math.random();
            if (rand < 0.4) hour = faker.number.int({ min: 9, max: 11 });
            else if (rand < 0.7) hour = faker.number.int({ min: 13, max: 16 });
            else hour = faker.number.int({ min: 9, max: 17 });

            const createdAt = new Date(date);
            createdAt.setHours(hour, faker.number.int({ min: 0, max: 59 }), 0, 0);

            // Determine Status
            const statusRoll = Math.random();
            let status: TokenStatus = TokenStatus.COMPLETED;
            if (statusRoll < 0.10) status = TokenStatus.NO_SHOW;
            else if (statusRoll < 0.15) status = TokenStatus.CANCELLED;

            // More active tokens for today
            if (d === 0 && statusRoll > 0.70) status = TokenStatus.ACTIVE;
            else if (d === 0 && statusRoll > 0.65) status = TokenStatus.IN_SERVICE;

            // Calculate Timestamps
            let calledAt = null;
            let serviceStartedAt = null;
            let completedAt = null;
            let cancelledAt = null;

            const queuePosition = status === TokenStatus.ACTIVE ? serviceTokenCounters[service.id] : 0;
            const estimatedWaitSeconds = status === TokenStatus.ACTIVE
                ? (queuePosition > 0 ? (queuePosition - 1) : 0) * service.estimatedServiceTime
                : faker.number.int({ min: 2, max: 45 }) * 60;

            const waitMinutes = estimatedWaitSeconds / 60;

            if (status !== TokenStatus.CANCELLED && status !== TokenStatus.ACTIVE) {
                calledAt = new Date(createdAt.getTime() + waitMinutes * 60000);

                if (status === TokenStatus.COMPLETED || status === TokenStatus.IN_SERVICE || status === TokenStatus.NO_SHOW) {
                    serviceStartedAt = new Date(calledAt.getTime() + faker.number.int({ min: 1, max: 3 }) * 60000);

                    if (status === TokenStatus.COMPLETED) {
                        const duration = service.estimatedServiceTime * (0.5 + Math.random());
                        completedAt = new Date(serviceStartedAt.getTime() + duration * 1000);
                    }
                }
            } else if (status === TokenStatus.CANCELLED) {
                cancelledAt = new Date(createdAt.getTime() + faker.number.int({ min: 5, max: 30 }) * 60000);
            }

            globalTokenCounter++;
            const tokenNumber = `${service.prefix}-${globalTokenCounter}`;

            // Store token data for bulk insert
            allTokenData.push({
                tokenNumber,
                status,
                queuePosition,
                estimatedWaitTime: Math.round(estimatedWaitSeconds),
                userId: user.id,
                serviceId: service.id,
                createdAt,
                calledAt,
                serviceStartedAt,
                completedAt,
                cancelledAt,
                cancellationReason: status === TokenStatus.CANCELLED ? 'Waited too long' : null,
            });
        }
    }

    // Bulk insert tokens using createMany (much faster!)
    console.log(`Inserting ${allTokenData.length} tokens using bulk insert...`);

    await prisma.token.createMany({
        data: allTokenData,
        skipDuplicates: true,
    });

    console.log('✅ All tokens inserted!');

    // Fetch all created tokens (we need their IDs for presence checks and abuse logs)
    console.log('Fetching created tokens...');
    const createdTokens = await prisma.token.findMany({
        orderBy: { createdAt: 'asc' },
    });
    console.log(`✅ Fetched ${createdTokens.length} tokens!`);

    // 5. Create Presence Checks and Abuse Logs using createMany
    console.log('Creating presence checks and abuse logs...');
    const presenceCheckData = [];
    const abuseLogData = [];

    for (const token of createdTokens) {
        if (token.status === TokenStatus.COMPLETED || token.status === TokenStatus.ACTIVE) {
            const service = services.find(s => s.id === token.serviceId);
            const isCompliant = Math.random() > 0.15;

            presenceCheckData.push({
                tokenId: token.id,
                latitude: service.latitude + (isCompliant ? 0.0001 : 0.01),
                longitude: service.longitude + (isCompliant ? 0.0001 : 0.01),
                distanceMeters: isCompliant ? faker.number.int({ min: 5, max: 50 }) : faker.number.int({ min: 200, max: 500 }),
                isWithinGeofence: isCompliant,
                checkType: PresenceCheckType.AT_TURN,
                isCompliant,
            });
        }

        if (token.status === TokenStatus.NO_SHOW) {
            abuseLogData.push({
                userId: token.userId,
                eventType: AbuseEventType.NO_SHOW,
                severity: 3,
                description: 'User failed to appear when called',
                createdAt: token.calledAt || token.createdAt,
            });
        }
    }

    // Bulk insert presence checks and abuse logs
    if (presenceCheckData.length > 0) {
        await prisma.presenceCheck.createMany({
            data: presenceCheckData,
            skipDuplicates: true,
        });
    }

    if (abuseLogData.length > 0) {
        await prisma.abuseLog.createMany({
            data: abuseLogData,
            skipDuplicates: true,
        });
    }

    console.log('✅ Presence checks and abuse logs created!');

    // 6. Ensure all services have active tokens
    console.log('Ensuring all services have active tokens...');
    const activeTokenData = [];

    for (const service of services) {
        const activeCount = await prisma.token.count({
            where: {
                serviceId: service.id,
                status: { in: [TokenStatus.ACTIVE, TokenStatus.CALLED] },
            },
        });

        if (activeCount === 0) {
            const tokensToCreate = faker.number.int({ min: 2, max: 5 });
            console.log(`  Creating ${tokensToCreate} active tokens for ${service.name}`);

            for (let i = 0; i < tokensToCreate; i++) {
                const user = faker.helpers.arrayElement(users);
                const queuePosition = i + 1;
                const estimatedWaitTime = (queuePosition - 1) * service.estimatedServiceTime;

                globalTokenCounter++;
                activeTokenData.push({
                    tokenNumber: `${service.prefix}-${globalTokenCounter}`,
                    status: TokenStatus.ACTIVE,
                    queuePosition,
                    estimatedWaitTime,
                    userId: user.id,
                    serviceId: service.id,
                });
            }
        }
    }

    if (activeTokenData.length > 0) {
        await prisma.token.createMany({
            data: activeTokenData,
            skipDuplicates: true,
        });
    }

    const totalTokens = await prisma.token.count();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Seeding complete in ${duration}s! Generated ${totalTokens} tokens across ${services.length} services.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
