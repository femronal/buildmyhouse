import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteNonActiveProjects() {
  const statusesToKeep = ['active', 'pending_payment'] as const;
  console.log('🗑️  Starting project cleanup...');
  console.log(`Keeping projects with status in: ${statusesToKeep.join(', ')}`);

  try {
    const [totalProjects, keepProjects] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: { in: [...statusesToKeep] } } }),
    ]);
    const deleteProjects = await prisma.project.findMany({
      where: { NOT: { status: { in: [...statusesToKeep] } } },
      select: { id: true, status: true, name: true },
    });

    console.log(`Total projects in DB: ${totalProjects}`);
    console.log(`Projects to keep: ${keepProjects}`);
    console.log(`Projects to delete: ${deleteProjects.length}`);

    if (deleteProjects.length === 0) {
      console.log('✅ Nothing to delete.');
      return;
    }

    const deleteProjectIds = deleteProjects.map((p) => p.id);

    // Delete in order to respect foreign key constraints
    console.log('Deleting payments for deleted projects...');
    const deletedPayments = await prisma.payment.deleteMany({
      where: { projectId: { in: deleteProjectIds } },
    });
    console.log(`✅ Deleted ${deletedPayments.count} payments`);

    console.log('Deleting stages for deleted projects...');
    const deletedStages = await prisma.stage.deleteMany({
      where: { projectId: { in: deleteProjectIds } },
    });
    console.log(`✅ Deleted ${deletedStages.count} stages`);

    console.log('Deleting order items for deleted projects...');
    const deletedOrderItems = await prisma.orderItem.deleteMany({
      where: { order: { projectId: { in: deleteProjectIds } } },
    });
    console.log(`✅ Deleted ${deletedOrderItems.count} order items`);

    console.log('Deleting orders for deleted projects...');
    const deletedOrders = await prisma.order.deleteMany({
      where: { projectId: { in: deleteProjectIds } },
    });
    console.log(`✅ Deleted ${deletedOrders.count} orders`);

    console.log('Deleting project requests for deleted projects...');
    const deletedRequests = await prisma.projectRequest.deleteMany({
      where: { projectId: { in: deleteProjectIds } },
    });
    console.log(`✅ Deleted ${deletedRequests.count} project requests`);

    console.log('Deleting conversations for deleted projects...');
    const deletedConversations = await prisma.conversation.deleteMany({
      where: { projectId: { in: deleteProjectIds } },
    });
    console.log(`✅ Deleted ${deletedConversations.count} conversations`);

    console.log('Deleting projects...');
    const deletedProjectsResult = await prisma.project.deleteMany({
      where: { id: { in: deleteProjectIds } },
    });
    console.log(`✅ Deleted ${deletedProjectsResult.count} projects`);

    const remaining = await prisma.project.count();
    console.log('\n🎉 Project cleanup completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total projects deleted: ${deletedProjectsResult.count}`);
    console.log(`Total projects remaining: ${remaining}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Error deleting projects:', error);
    throw error;
  }
}

deleteNonActiveProjects()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
