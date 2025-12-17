import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.material.deleteMany();
  await prisma.contractor.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.stage.deleteMany();
  await prisma.project.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany();

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Users
  console.log('👥 Creating users...');
  
  const homeowner = await prisma.user.create({
    data: {
      email: 'homeowner@example.com',
      password: hashedPassword,
      fullName: 'John Homeowner',
      phone: '+1234567890',
      role: 'homeowner',
      verified: true,
    },
  });

  const generalContractor = await prisma.user.create({
    data: {
      email: 'gc@example.com',
      password: hashedPassword,
      fullName: 'Mike Contractor',
      phone: '+1234567891',
      role: 'general_contractor',
      verified: true,
    },
  });

  const subcontractor = await prisma.user.create({
    data: {
      email: 'sub@example.com',
      password: hashedPassword,
      fullName: 'Sarah Subcontractor',
      phone: '+1234567892',
      role: 'subcontractor',
      verified: true,
    },
  });

  const vendor = await prisma.user.create({
    data: {
      email: 'vendor@example.com',
      password: hashedPassword,
      fullName: 'Vendor Supplies Co.',
      phone: '+1234567893',
      role: 'vendor',
      verified: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@buildmyhouse.com',
      password: hashedPassword,
      fullName: 'Admin User',
      phone: '+1234567894',
      role: 'admin',
      verified: true,
    },
  });

  // Create Contractor Profile
  console.log('🏗️ Creating contractor profiles...');
  const contractorProfile = await prisma.contractor.create({
    data: {
      userId: generalContractor.id,
      name: 'Mike\'s Construction LLC',
      specialty: 'Residential Construction',
      type: 'general_contractor',
      hiringFee: 5000,
      rating: 4.8,
      projects: 25,
      imageUrl: 'https://example.com/contractor.jpg',
    },
  });

  // Create Projects
  console.log('🏠 Creating projects...');
  const project1 = await prisma.project.create({
    data: {
      name: 'Modern Family Home',
      address: '123 Main St, Anytown, USA',
      homeownerId: homeowner.id,
      generalContractorId: generalContractor.id,
      status: 'active',
      budget: 250000,
      spent: 125000,
      progress: 50,
      currentStage: 'Framing',
      startDate: new Date('2024-01-15'),
      dueDate: new Date('2024-12-31'),
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Luxury Kitchen Renovation',
      address: '456 Oak Ave, Anytown, USA',
      homeownerId: homeowner.id,
      status: 'draft',
      budget: 75000,
      spent: 0,
      progress: 0,
    },
  });

  // Create Stages
  console.log('📋 Creating project stages...');
  const stages = [
    {
      projectId: project1.id,
      name: 'Foundation',
      status: 'completed',
      order: 1,
      estimatedCost: 30000,
      actualCost: 28000,
      estimatedDuration: '2 weeks',
      startDate: new Date('2024-01-15'),
      completionDate: new Date('2024-01-29'),
    },
    {
      projectId: project1.id,
      name: 'Framing',
      status: 'in_progress',
      order: 2,
      estimatedCost: 50000,
      actualCost: 45000,
      estimatedDuration: '3 weeks',
      startDate: new Date('2024-02-01'),
    },
    {
      projectId: project1.id,
      name: 'Electrical & Plumbing',
      status: 'not_started',
      order: 3,
      estimatedCost: 40000,
      estimatedDuration: '2 weeks',
    },
    {
      projectId: project1.id,
      name: 'Roofing',
      status: 'not_started',
      order: 4,
      estimatedCost: 35000,
      estimatedDuration: '1 week',
    },
    {
      projectId: project1.id,
      name: 'Interior Finishing',
      status: 'not_started',
      order: 5,
      estimatedCost: 95000,
      estimatedDuration: '6 weeks',
    },
  ];

  for (const stageData of stages) {
    await prisma.stage.create({ data: stageData });
  }

  // Create Materials
  console.log('🛒 Creating materials...');
  const materials = [
    {
      vendorId: vendor.id,
      name: 'Premium Hardwood Flooring',
      brand: 'OakWood Premium',
      description: 'High-quality hardwood flooring, perfect for modern homes',
      category: 'wood',
      price: 8.99,
      unit: 'sqft',
      stock: 500,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=400&q=80',
    },
    {
      vendorId: vendor.id,
      name: 'Energy Efficient Windows',
      brand: 'EcoWindow Pro',
      description: 'Double-pane energy efficient windows',
      category: 'fixtures',
      price: 450.00,
      unit: 'each',
      stock: 25,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1545259742-12f1d2e4c633?w=400&q=80',
    },
    {
      vendorId: vendor.id,
      name: 'Copper Plumbing Pipes',
      brand: 'PlumbMaster',
      description: 'Durable copper pipes for residential plumbing',
      category: 'plumbing',
      price: 125.00,
      unit: 'length',
      stock: 100,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&q=80',
    },
    {
      vendorId: vendor.id,
      name: 'Premium Roof Shingles',
      brand: 'RoofGuard Elite',
      description: 'Weather-resistant asphalt shingles',
      category: 'other',
      price: 3.50,
      unit: 'sqft',
      stock: 1000,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80',
    },
  ];

  const createdMaterials = [];
  for (const materialData of materials) {
    const material = await prisma.material.create({ data: materialData });
    createdMaterials.push(material);
  }

  // Create Orders
  console.log('📦 Creating orders...');
  const order = await prisma.order.create({
    data: {
      userId: homeowner.id,
      projectId: project1.id,
      type: 'material',
      status: 'pending',
      totalAmount: 12590,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      materialId: createdMaterials[0].id,
      quantity: 1000,
      price: 8.99,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      materialId: createdMaterials[1].id,
      quantity: 8,
      price: 450.00,
    },
  });

  // Create Reviews
  console.log('⭐ Creating reviews...');
  await prisma.review.create({
    data: {
      userId: homeowner.id,
      materialId: createdMaterials[0].id,
      rating: 5,
      comment: 'Excellent quality flooring, very satisfied!',
    },
  });

  await prisma.review.create({
    data: {
      userId: homeowner.id,
      contractorId: contractorProfile.id,
      rating: 5,
      comment: 'Professional work, completed on time and within budget.',
    },
  });

  // Create Payments
  console.log('💳 Creating payments...');
  const foundationStage = await prisma.stage.findFirst({
    where: { projectId: project1.id, order: 1 },
  });

  if (foundationStage) {
    await prisma.payment.create({
      data: {
        projectId: project1.id,
        stageId: foundationStage.id,
        amount: 28000,
        status: 'completed',
        method: 'stripe',
        transactionId: 'txn_test_123456',
      },
    });
  }

  console.log('✅ Database seed completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Homeowner:');
  console.log('  Email: homeowner@example.com');
  console.log('  Password: password123');
  console.log('\nGeneral Contractor:');
  console.log('  Email: gc@example.com');
  console.log('  Password: password123');
  console.log('\nSubcontractor:');
  console.log('  Email: sub@example.com');
  console.log('  Password: password123');
  console.log('\nVendor:');
  console.log('  Email: vendor@example.com');
  console.log('  Password: password123');
  console.log('\nAdmin:');
  console.log('  Email: admin@buildmyhouse.com');
  console.log('  Password: password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

