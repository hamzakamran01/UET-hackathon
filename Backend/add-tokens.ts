import { PrismaClient, TokenStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    console.log('🎫 Adding tokens for today and previous week...\n');

    // Get all active services
    const services = await prisma.service.findMany({
        where: { isActive: true }
    });

    if (services.length === 0) {
        console.log('❌ No active services found. Please run seed:analytics first.');
        return;
    }

    console.log(`Found ${services.length} active services:\n`);
    services.forEach(s => console.log(`  - ${s.name}`));

    // Get or create users
    const users = await prisma.user.findMany({
        take: 10,
    });

    if (users.length === 0) {
        console.log('\n⚠️  No users found. Creating sample users...');
        for (let i = 0; i < 10; i++) {
            await prisma.user.create({
                data: {
                    email: `token-user-${i}@example.com`,
                    phone: `+1555100${i.toString().padStart(4, '0')}`,
                    emailVerified: true,
                    phoneVerified: true,
                    isBlocked: false,
                },
            });
        }
    }

    const allUsers = await prisma.user.findMany({ take: 10 });

    // Get current highest token number to continue sequence
    let globalTokenCounter = 5000;
    const lastToken = await prisma.token.findFirst({
        orderBy: { createdAt: 'desc' },
    });

    if (lastToken) {
        const match = lastToken.tokenNumber.match(/-(\d+)/);
        if (match) {
            globalTokenCounter = parseInt(match[1], 10);
        }
    }

    const now = new Date();
    const allTokenData = [];
    let totalTokensToCreate = 0;

    console.log('\n📅 Generating tokens for the last 7 days + today...\n');

    // Loop through last 7 days + today (0 to 7)
    for (let daysAgo = 7; daysAgo >= 0; daysAgo--) {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() - daysAgo);

        const dateStr = targetDate.toLocaleDateString();
        const isToday = daysAgo === 0;

        console.log(`📆 ${isToday ? 'TODAY' : dateStr}:`);

        // For each service, create random number of tokens
        for (const service of services) {
            // Random number of tokens per service per day (5-15)
            const tokensForService = faker.number.int({ min: 5, max: 15 });

            // Get service prefix from name
            let prefix = service.name.substring(0, 3).toUpperCase();

            // Map service names to prefixes used in seed-analytics
            const prefixMap: Record<string, string> = {
                'General Consultation': 'GEN',
                'Express Counter': 'EXP',
                'VIP Support': 'VIP',
                'Lab Testing': 'LAB',
                'Pharmacy': 'PHR',
            };

            if (prefixMap[service.name]) {
                prefix = prefixMap[service.name];
            }

            console.log(`  ${service.name}: ${tokensForService} tokens`);
            totalTokensToCreate += tokensForService;

            for (let i = 0; i < tokensForService; i++) {
                const user = faker.helpers.arrayElement(allUsers);

                // Random hour during business hours (9 AM - 5 PM)
                // Peak hours: 9-11 AM (40%), 1-4 PM (30%), rest (30%)
                let hour = 9;
                const rand = Math.random();
                if (rand < 0.4) hour = faker.number.int({ min: 9, max: 11 });
                else if (rand < 0.7) hour = faker.number.int({ min: 13, max: 16 });
                else hour = faker.number.int({ min: 9, max: 17 });

                const createdAt = new Date(targetDate);
                createdAt.setHours(hour, faker.number.int({ min: 0, max: 59 }), 0, 0);

                // Determine status based on whether it's today or past
                let status: TokenStatus;
                let calledAt = null;
                let serviceStartedAt = null;
                let completedAt = null;
                let cancelledAt = null;
                let queuePosition = 0;

                if (isToday) {
                    // Today: Mix of ACTIVE, CALLED, IN_SERVICE, COMPLETED
                    const statusRoll = Math.random();
                    if (statusRoll < 0.3) {
                        status = TokenStatus.ACTIVE;
                        queuePosition = i + 1;
                    } else if (statusRoll < 0.5) {
                        status = TokenStatus.CALLED;
                        calledAt = new Date(createdAt.getTime() + faker.number.int({ min: 10, max: 60 }) * 60000);
                    } else if (statusRoll < 0.7) {
                        status = TokenStatus.IN_SERVICE;
                        calledAt = new Date(createdAt.getTime() + faker.number.int({ min: 10, max: 60 }) * 60000);
                        serviceStartedAt = new Date(calledAt.getTime() + faker.number.int({ min: 1, max: 5 }) * 60000);
                    } else {
                        status = TokenStatus.COMPLETED;
                        const waitMinutes = faker.number.int({ min: 5, max: 45 });
                        calledAt = new Date(createdAt.getTime() + waitMinutes * 60000);
                        serviceStartedAt = new Date(calledAt.getTime() + faker.number.int({ min: 1, max: 3 }) * 60000);
                        const serviceDuration = service.estimatedServiceTime * (0.5 + Math.random());
                        completedAt = new Date(serviceStartedAt.getTime() + serviceDuration * 1000);
                    }
                } else {
                    // Past days: Mostly COMPLETED, some NO_SHOW, some CANCELLED
                    const statusRoll = Math.random();
                    if (statusRoll < 0.75) {
                        // COMPLETED
                        status = TokenStatus.COMPLETED;
                        const waitMinutes = faker.number.int({ min: 5, max: 45 });
                        calledAt = new Date(createdAt.getTime() + waitMinutes * 60000);
                        serviceStartedAt = new Date(calledAt.getTime() + faker.number.int({ min: 1, max: 3 }) * 60000);
                        const serviceDuration = service.estimatedServiceTime * (0.5 + Math.random());
                        completedAt = new Date(serviceStartedAt.getTime() + serviceDuration * 1000);
                    } else if (statusRoll < 0.85) {
                        // NO_SHOW
                        status = TokenStatus.NO_SHOW;
                        const waitMinutes = faker.number.int({ min: 5, max: 45 });
                        calledAt = new Date(createdAt.getTime() + waitMinutes * 60000);
                        serviceStartedAt = new Date(calledAt.getTime() + faker.number.int({ min: 5, max: 15 }) * 60000);
                    } else {
                        // CANCELLED
                        status = TokenStatus.CANCELLED;
                        cancelledAt = new Date(createdAt.getTime() + faker.number.int({ min: 5, max: 30 }) * 60000);
                    }
                }

                const estimatedWaitTime = queuePosition > 0
                    ? (queuePosition - 1) * service.estimatedServiceTime
                    : faker.number.int({ min: 2, max: 45 }) * 60;

                globalTokenCounter++;
                const tokenNumber = `${prefix}-${globalTokenCounter}`;

                allTokenData.push({
                    tokenNumber,
                    status,
                    queuePosition,
                    estimatedWaitTime,
                    userId: user.id,
                    serviceId: service.id,
                    createdAt,
                    calledAt,
                    serviceStartedAt,
                    completedAt,
                    cancelledAt,
                    cancellationReason: status === TokenStatus.CANCELLED ? 'User cancelled' : null,
                });
            }
        }
        console.log('');
    }

    // Bulk insert all tokens
    console.log(`\n💾 Inserting ${totalTokensToCreate} tokens into database...`);
    await prisma.token.createMany({
        data: allTokenData,
        skipDuplicates: true,
    });

    console.log('✅ All tokens inserted successfully!');

    // Show summary
    console.log('\n📊 Summary:');
    console.log(`   Total tokens created: ${totalTokensToCreate}`);
    console.log(`   Services covered: ${services.length}`);
    console.log(`   Date range: Last 7 days + today`);

    // Show breakdown by status for today
    const todayTokens = allTokenData.filter(t => {
        const tokenDate = new Date(t.createdAt);
        return tokenDate.toDateString() === now.toDateString();
    });

    const statusCounts = todayTokens.reduce((acc, token) => {
        acc[token.status] = (acc[token.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    console.log('\n📈 Today\'s tokens by status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
    });

    console.log('\n🎉 Done!\n');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
