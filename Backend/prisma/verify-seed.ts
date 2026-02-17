import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verifying Analytics Data...');

    const userCount = await prisma.user.count();
    console.log(`Users: ${userCount}`);

    const serviceCount = await prisma.service.count();
    console.log(`Services: ${serviceCount}`);

    const tokenCount = await prisma.token.count();
    console.log(`Tokens: ${tokenCount}`);

    const presenceCheckCount = await prisma.presenceCheck.count();
    console.log(`Presence Checks: ${presenceCheckCount}`);

    const abuseLogCount = await prisma.abuseLog.count();
    console.log(`Abuse Logs: ${abuseLogCount}`);

    console.log('\n--- Tokens by Status ---');
    const tokensByStatus = await prisma.token.groupBy({
        by: ['status'],
        _count: {
            id: true,
        },
    });
    tokensByStatus.forEach(t => {
        console.log(`${t.status}: ${t._count.id}`);
    });

    console.log('\n--- Tokens by Date (Last 5 Days) ---');
    const tokens = await prisma.token.findMany({
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1000,
    });

    const tokensByDate: { [key: string]: number } = {};
    tokens.forEach(t => {
        const date = t.createdAt.toISOString().split('T')[0];
        tokensByDate[date] = (tokensByDate[date] || 0) + 1;
    });

    Object.entries(tokensByDate).slice(0, 5).forEach(([date, count]) => {
        console.log(`${date}: ${count}`);
    });

    console.log(`\nTotal Days Covered: ${Object.keys(tokensByDate).length}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
