import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllProjects() {
  console.log('🗑️  Starting to delete all projects...');

  try {
    // Delete in order to respect foreign key constraints
    // First delete dependent records
    console.log('Deleting payments...');
    const deletedPayments = await prisma.payment.deleteMany();
    console.log(`✅ Deleted ${deletedPayments.count} payments`);

    console.log('Deleting stages...');
    const deletedStages = await prisma.stage.deleteMany();
    console.log(`✅ Deleted ${deletedStages.count} stages`);

    console.log('Deleting order items...');
    const deletedOrderItems = await prisma.orderItem.deleteMany();
    console.log(`✅ Deleted ${deletedOrderItems.count} order items`);

    console.log('Deleting orders...');
    const deletedOrders = await prisma.order.deleteMany();
    console.log(`✅ Deleted ${deletedOrders.count} orders`);

    console.log('Deleting project requests...');
    const deletedRequests = await prisma.projectRequest.deleteMany();
    console.log(`✅ Deleted ${deletedRequests.count} project requests`);

    // Finally delete projects
    console.log('Deleting projects...');
    const deletedProjects = await prisma.project.deleteMany();
    console.log(`✅ Deleted ${deletedProjects.count} projects`);

    console.log('\n🎉 All projects and related data have been deleted successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total projects deleted: ${deletedProjects.count}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Error deleting projects:', error);
    throw error;
  }
}

deleteAllProjects()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
