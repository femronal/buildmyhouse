"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const gcUsers = await prisma.user.findMany({
        where: { role: 'general_contractor' },
        include: { contractorProfile: true },
    });
    const missing = gcUsers.filter((u) => !u.contractorProfile);
    if (missing.length === 0) {
        console.log('✅ All GC users already have Contractor profiles.');
        return;
    }
    console.log(`Found ${missing.length} GC user(s) without Contractor profile. Creating...`);
    for (const user of missing) {
        await prisma.contractor.create({
            data: {
                userId: user.id,
                name: user.fullName || 'General Contractor',
                specialty: 'General Construction',
                type: 'general_contractor',
                hiringFee: 0,
            },
        });
        console.log(`  ✓ Created Contractor for ${user.fullName} (${user.email})`);
    }
    console.log(`✅ Created ${missing.length} Contractor profile(s).`);
}
main()
    .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=backfill-gc-contractors.js.map