import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create initial config
    const config = await prisma.config.upsert({
        where: { id: 'default' },
        update: {},
        create: {
            id: 'default',
            maxShiftHours: 12,
            sheetsSyncEnabled: true,
        },
    });

    console.log('Created config:', config);

    // Create initial staff members
    const staff = [
        {
            email: 'lisa@example.com',
            name: 'Lisa',
            role: 'ADMIN',
            hourlyRate: 12.50,
            overtimeThreshold: 40,
            overtimeRate: 18.75, // 1.5x rate
        },
        {
            email: 'clareh@example.com',
            name: 'Clare H',
            role: 'STAFF',
            hourlyRate: 11.00,
            overtimeThreshold: 40,
            overtimeRate: 16.50, // 1.5x rate
        },
        {
            email: 'connor@example.com',
            name: 'Connor',
            role: 'STAFF',
            hourlyRate: 11.00,
            overtimeThreshold: 40,
            overtimeRate: 16.50,
        },
        {
            email: 'shaz@example.com',
            name: 'Shaz',
            role: 'MANAGER',
            hourlyRate: 13.00,
            overtimeThreshold: 40,
            overtimeRate: 19.50, // 1.5x rate
        },
        {
            email: 'clare@example.com',
            name: 'Clare',
            role: 'STAFF',
            hourlyRate: 11.00,
            overtimeThreshold: 40,
            overtimeRate: 16.50,
        },
    ];

    for (const member of staff) {
        const user = await prisma.user.upsert({
            where: { email: member.email },
            update: {},
            create: member,
        });
        console.log(`Created user: ${user.name} (${user.role})`);
    }

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
