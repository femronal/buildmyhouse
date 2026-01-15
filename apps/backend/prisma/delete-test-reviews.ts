import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteTestReviews() {
  console.log('🗑️  Starting to delete test/seed reviews...');

  try {
    // Find all users with test email addresses (@example.com)
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: '@example.com',
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    console.log(`📋 Found ${testUsers.length} test users with @example.com emails`);

    if (testUsers.length === 0) {
      console.log('✅ No test users found. Nothing to delete.');
      return;
    }

    const testUserIds = testUsers.map(user => user.id);
    console.log('👥 Test user IDs:', testUserIds);

    // Delete reviews from test users
    console.log('Deleting reviews from test users...');
    const deletedReviews = await prisma.review.deleteMany({
      where: {
        userId: {
          in: testUserIds,
        },
      },
    });

    console.log('\n🎉 Test reviews cleanup completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total test reviews deleted: ${deletedReviews.count}`);
    console.log(`Test users cleaned: ${testUsers.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Also update contractor ratings after deleting reviews
    if (deletedReviews.count > 0) {
      console.log('🔄 Updating contractor ratings...');
      const contractors = await prisma.contractor.findMany();
      
      for (const contractor of contractors) {
        const remainingReviews = await prisma.review.findMany({
          where: { contractorId: contractor.id },
        });

        if (remainingReviews.length > 0) {
          const avgRating = remainingReviews.reduce((sum, r) => sum + r.rating, 0) / remainingReviews.length;
          await prisma.contractor.update({
            where: { id: contractor.id },
            data: {
              rating: avgRating,
              reviews: remainingReviews.length,
            },
          });
        } else {
          await prisma.contractor.update({
            where: { id: contractor.id },
            data: {
              rating: 0,
              reviews: 0,
            },
          });
        }
      }
      console.log('✅ Contractor ratings updated');
    }
  } catch (error) {
    console.error('❌ Error deleting test reviews:', error);
    throw error;
  }
}

deleteTestReviews()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


