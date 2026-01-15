import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // IMPORTANT: Set RESET_DB=true in environment to clear existing data
  // This prevents accidental data loss during development
  const shouldReset = process.env.RESET_DB === 'true';
  
  if (shouldReset) {
    // Clear existing data (only if RESET_DB=true)
    console.log('🧹 Cleaning existing data...');
    await prisma.review.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.material.deleteMany();
    await prisma.contractor.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.stage.deleteMany();
    // Delete in order to respect foreign key constraints
    await prisma.designImage.deleteMany();
    await prisma.design.deleteMany();
    await prisma.project.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.user.deleteMany();
  } else {
    console.log('⚠️  Skipping data deletion (RESET_DB not set to "true")');
    console.log('   To reset database, run: RESET_DB=true pnpm prisma:seed');
    console.log('   Existing data will be preserved and seed data will be added if users don\'t exist.');
  }

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Users (only if they don't exist)
  console.log('👥 Creating users...');
  
  let homeowner = await prisma.user.findUnique({
    where: { email: 'homeowner@example.com' },
  });
  
  if (!homeowner) {
    homeowner = await prisma.user.create({
      data: {
        email: 'homeowner@example.com',
        password: hashedPassword,
        fullName: 'John Homeowner',
        phone: '+1234567890',
        role: 'homeowner',
        verified: true,
      },
    });
  } else {
    console.log('   Homeowner user already exists, skipping creation');
  }

  let generalContractor = await prisma.user.findUnique({
    where: { email: 'gc@example.com' },
  });
  
  if (!generalContractor) {
    generalContractor = await prisma.user.create({
      data: {
        email: 'gc@example.com',
        password: hashedPassword,
        fullName: 'Mike Contractor',
        phone: '+1234567891',
        role: 'general_contractor',
        verified: true,
      },
    });
  } else {
    console.log('   General Contractor user already exists, skipping creation');
  }

  // Create Subcontractors with different specialties
  console.log('🔧 Creating subcontractors...');
  const subcontractorsData = [
    {
      email: 'electrical@example.com',
      fullName: 'PowerLine Electricals',
      phone: '+2348011111111',
      contractor: {
        name: 'PowerLine Electricals',
        specialty: 'Electrical',
        type: 'subcontractor',
        hiringFee: 3500,
        rating: 4.9,
        reviews: 156,
        projects: 89,
        verified: true,
        location: 'Lagos, Nigeria',
        description: 'Professional electrical installation and repair services',
        imageUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&q=80',
      },
    },
    {
      email: 'plumbing@example.com',
      fullName: 'AquaFlow Plumbing Co.',
      phone: '+2348022222222',
      contractor: {
        name: 'AquaFlow Plumbing Co.',
        specialty: 'Plumbing',
        type: 'subcontractor',
        hiringFee: 3200,
        rating: 4.8,
        reviews: 124,
        projects: 67,
        verified: true,
        location: 'Lagos, Nigeria',
        description: 'Expert plumbing services for residential and commercial projects',
        imageUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&q=80',
      },
    },
    {
      email: 'foundation@example.com',
      fullName: 'Emeka Builders',
      phone: '+2348033333333',
      contractor: {
        name: 'Emeka Builders',
        specialty: 'Foundation',
        type: 'subcontractor',
        hiringFee: 4500,
        rating: 4.9,
        reviews: 98,
        projects: 72,
        verified: true,
        location: 'Lagos, Nigeria',
        description: 'Specialized foundation and concrete work',
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80',
      },
    },
    {
      email: 'roofing@example.com',
      fullName: 'TopRoof Contractors',
      phone: '+2348044444444',
      contractor: {
        name: 'TopRoof Contractors',
        specialty: 'Roofing',
        type: 'subcontractor',
        hiringFee: 4000,
        rating: 4.7,
        reviews: 112,
        projects: 85,
        verified: true,
        location: 'Lagos, Nigeria',
        description: 'Quality roofing solutions for all building types',
        imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80',
      },
    },
    {
      email: 'hvac@example.com',
      fullName: 'CoolAir HVAC Services',
      phone: '+2348055555555',
      contractor: {
        name: 'CoolAir HVAC Services',
        specialty: 'HVAC',
        type: 'subcontractor',
        hiringFee: 3800,
        rating: 4.6,
        reviews: 87,
        projects: 64,
        verified: true,
        location: 'Lagos, Nigeria',
        description: 'Heating, ventilation, and air conditioning installation',
        imageUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&q=80',
      },
    },
    {
      email: 'painting@example.com',
      fullName: 'Perfect Paint Pro',
      phone: '+2348066666666',
      contractor: {
        name: 'Perfect Paint Pro',
        specialty: 'Painting',
        type: 'subcontractor',
        hiringFee: 2500,
        rating: 4.5,
        reviews: 95,
        projects: 78,
        verified: true,
        location: 'Lagos, Nigeria',
        description: 'Professional interior and exterior painting services',
        imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&q=80',
      },
    },
    {
      email: 'flooring@example.com',
      fullName: 'Elite Flooring Solutions',
      phone: '+2348077777777',
      contractor: {
        name: 'Elite Flooring Solutions',
        specialty: 'Flooring',
        type: 'subcontractor',
        hiringFee: 3000,
        rating: 4.8,
        reviews: 103,
        projects: 76,
        verified: true,
        location: 'Lagos, Nigeria',
        description: 'Premium flooring installation and repair',
        imageUrl: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=400&q=80',
      },
    },
    {
      email: 'carpentry@example.com',
      fullName: 'Master Carpenters Ltd',
      phone: '+2348088888888',
      contractor: {
        name: 'Master Carpenters Ltd',
        specialty: 'Carpentry',
        type: 'subcontractor',
        hiringFee: 2800,
        rating: 4.7,
        reviews: 89,
        projects: 65,
        verified: true,
        location: 'Lagos, Nigeria',
        description: 'Expert carpentry and woodworking services',
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80',
      },
    },
  ];

  const createdSubcontractors = [];
  for (const subData of subcontractorsData) {
    const user = await prisma.user.create({
      data: {
        email: subData.email,
        password: hashedPassword,
        fullName: subData.fullName,
        phone: subData.phone,
        role: 'subcontractor',
        verified: subData.contractor.verified,
      },
    });

    const contractor = await prisma.contractor.create({
      data: {
        userId: user.id,
        ...subData.contractor,
      },
    });
    createdSubcontractors.push({ user, contractor });
  }

  console.log(`✅ Created ${subcontractorsData.length} subcontractors`);

  // Keep the original subcontractor for backward compatibility
  const subcontractor = createdSubcontractors[0].user;

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
      reviews: 45,
      projects: 25,
      verified: true,
      location: 'Lagos, Nigeria',
      description: 'Experienced residential construction company',
      imageUrl: 'https://example.com/contractor.jpg',
    },
  });

  // Create 10+ Additional General Contractors (some matching Lagos for recommendations)
  console.log('🏗️ Creating additional General Contractors...');
  const additionalGCs = [
    // High-rated Lagos GCs (will be recommended)
    {
      email: 'lagosbuilders@example.com',
      fullName: 'Lagos Elite Builders',
      phone: '+2348012345678',
      contractor: {
        name: 'Lagos Elite Builders',
        specialty: 'Residential & Commercial Construction',
        type: 'general_contractor',
        hiringFee: 8000,
        rating: 4.9,
        reviews: 120,
        projects: 95,
        verified: true,
        location: 'Lagos, Nigeria',
        description: 'Premium construction services in Lagos with 15+ years experience',
      },
    },
    {
      email: 'premiumconstruction@example.com',
      fullName: 'Premium Construction Services',
      phone: '+2348023456789',
      contractor: {
        name: 'Premium Construction Services',
        specialty: 'Luxury Residential Construction',
        type: 'general_contractor',
        hiringFee: 12000,
        rating: 4.8,
        reviews: 85,
        projects: 68,
        verified: true,
        location: 'Lagos, Nigeria',
        description: 'Specializing in high-end residential projects in Lagos',
      },
    },
    {
      email: 'nigeriabuilders@example.com',
      fullName: 'Nigeria Builders Co.',
      phone: '+2348034567890',
      contractor: {
        name: 'Nigeria Builders Co.',
        specialty: 'Residential Construction',
        type: 'general_contractor',
        hiringFee: 6000,
        rating: 4.7,
        reviews: 95,
        projects: 72,
        verified: true,
        location: 'Lagos, Nigeria',
        description: 'Trusted builder serving Lagos and surrounding areas',
      },
    },
    {
      email: 'africanconstruction@example.com',
      fullName: 'African Construction Group',
      phone: '+2348045678901',
      contractor: {
        name: 'African Construction Group',
        specialty: 'Residential & Infrastructure',
        type: 'general_contractor',
        hiringFee: 7500,
        rating: 4.6,
        reviews: 110,
        projects: 88,
        verified: true,
        location: 'Lagos, Nigeria',
        description: 'Leading construction company in West Africa',
      },
    },
    {
      email: 'westafricabuilders@example.com',
      fullName: 'West Africa Builders',
      phone: '+2348056789012',
      contractor: {
        name: 'West Africa Builders',
        specialty: 'Residential Construction',
        type: 'general_contractor',
        hiringFee: 5500,
        rating: 4.5,
        reviews: 78,
        projects: 55,
        verified: true,
        location: 'Lagos, Nigeria',
        description: 'Quality construction services across Lagos',
      },
    },
    // Other locations (won't match strict criteria but will show in fallback)
    {
      email: 'abujabuilders@example.com',
      fullName: 'Abuja Construction Ltd',
      phone: '+2348067890123',
      contractor: {
        name: 'Abuja Construction Ltd',
        specialty: 'Residential Construction',
        type: 'general_contractor',
        hiringFee: 7000,
        rating: 4.7,
        reviews: 65,
        projects: 48,
        verified: true,
        location: 'Abuja, Nigeria',
        description: 'Professional construction services in Abuja',
      },
    },
    {
      email: 'portbuilders@example.com',
      fullName: 'Port Harcourt Builders',
      phone: '+2348078901234',
      contractor: {
        name: 'Port Harcourt Builders',
        specialty: 'Residential Construction',
        type: 'general_contractor',
        hiringFee: 5000,
        rating: 4.4,
        reviews: 52,
        projects: 38,
        verified: false,
        location: 'Port Harcourt, Nigeria',
        description: 'Reliable construction services in Port Harcourt',
      },
    },
    {
      email: 'kanobuilders@example.com',
      fullName: 'Kano Construction Services',
      phone: '+2348089012345',
      contractor: {
        name: 'Kano Construction Services',
        specialty: 'Residential Construction',
        type: 'general_contractor',
        hiringFee: 4500,
        rating: 4.3,
        reviews: 42,
        projects: 32,
        verified: false,
        location: 'Kano, Nigeria',
        description: 'Quality construction in Northern Nigeria',
      },
    },
    {
      email: 'ibadanbuilders@example.com',
      fullName: 'Ibadan Builders Inc',
      phone: '+2348090123456',
      contractor: {
        name: 'Ibadan Builders Inc',
        specialty: 'Residential Construction',
        type: 'general_contractor',
        hiringFee: 4800,
        rating: 4.2,
        reviews: 38,
        projects: 28,
        verified: false,
        location: 'Ibadan, Nigeria',
        description: 'Trusted builders in Ibadan',
      },
    },
    {
      email: 'enugubuilders@example.com',
      fullName: 'Enugu Construction Co.',
      phone: '+2348101234567',
      contractor: {
        name: 'Enugu Construction Co.',
        specialty: 'Residential Construction',
        type: 'general_contractor',
        hiringFee: 4200,
        rating: 4.1,
        reviews: 35,
        projects: 25,
        verified: false,
        location: 'Enugu, Nigeria',
        description: 'Professional construction in Enugu',
      },
    },
    {
      email: 'calabarbuilders@example.com',
      fullName: 'Calabar Builders',
      phone: '+2348112345678',
      contractor: {
        name: 'Calabar Builders',
        specialty: 'Residential Construction',
        type: 'general_contractor',
        hiringFee: 4000,
        rating: 4.0,
        reviews: 28,
        projects: 20,
        verified: false,
        location: 'Calabar, Nigeria',
        description: 'Quality construction services in Calabar',
      },
    },
    {
      email: 'benincitybuilders@example.com',
      fullName: 'Benin City Builders',
      phone: '+2348123456789',
      contractor: {
        name: 'Benin City Builders',
        specialty: 'Residential Construction',
        type: 'general_contractor',
        hiringFee: 3800,
        rating: 3.9,
        reviews: 25,
        projects: 18,
        verified: false,
        location: 'Benin City, Nigeria',
        description: 'Affordable construction in Benin City',
      },
    },
  ];

  for (const gcData of additionalGCs) {
    const user = await prisma.user.create({
      data: {
        email: gcData.email,
        password: hashedPassword,
        fullName: gcData.fullName,
        phone: gcData.phone,
        role: 'general_contractor',
        verified: gcData.contractor.verified,
      },
    });

    await prisma.contractor.create({
      data: {
        userId: user.id,
        ...gcData.contractor,
      },
    });
  }

  console.log(`✅ Created ${additionalGCs.length} additional General Contractors`);

  // Create Projects (only if they don't exist)
  console.log('🏠 Creating projects...');
  let project1 = await prisma.project.findFirst({
    where: {
      name: 'Modern Family Home',
      homeownerId: homeowner.id,
    },
  });
  
  let project1WasCreated = false;
  if (!project1) {
    project1 = await prisma.project.create({
      data: {
        name: 'Modern Family Home',
        address: '123 Main St, Anytown, CA 94102, USA',
        street: '123 Main St',
        city: 'Anytown',
        state: 'California',
        zipCode: '94102',
        country: 'USA',
        latitude: 37.7749,
        longitude: -122.4194,
        homeownerId: homeowner.id,
        generalContractorId: generalContractor.id,
        status: 'active',
        budget: 250000,
        spent: 0, // Start from scratch - no money spent yet
        progress: 0, // Start from scratch - 0% progress
        currentStage: null, // No current stage - project just started
        startDate: new Date(), // Use current date as start date
        dueDate: new Date('2024-12-31'),
      },
    });
    project1WasCreated = true;
    console.log('   Created seed project: Modern Family Home (starting from scratch)');
  } else {
    console.log('   Seed project already exists, skipping creation (preserving your progress!)');
  }

  const project2 = await prisma.project.create({
    data: {
      name: 'Luxury Kitchen Renovation',
      address: '456 Oak Ave, Brooklyn, NY 11201, USA',
      street: '456 Oak Ave',
      city: 'Brooklyn',
      state: 'New York',
      zipCode: '11201',
      country: 'USA',
      latitude: 40.6782,
      longitude: -73.9442,
      homeownerId: homeowner.id,
      status: 'draft',
      budget: 75000,
      spent: 0,
      progress: 0,
    },
  });

  // Create Stages (all starting from scratch - not_started)
  console.log('📋 Creating project stages...');
  const stages = [
    {
      projectId: project1.id,
      name: 'Foundation',
      status: 'not_started', // Start from scratch
      order: 1,
      estimatedCost: 30000,
      estimatedDuration: '2 weeks',
      // No actualCost, startDate, or completionDate - project just started
    },
    {
      projectId: project1.id,
      name: 'Framing',
      status: 'not_started', // Start from scratch
      order: 2,
      estimatedCost: 50000,
      estimatedDuration: '3 weeks',
      // No actualCost, startDate, or completionDate - project just started
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

  // Only create stages if project was just created (not if it already existed)
  if (project1WasCreated) {
    for (const stageData of stages) {
      await prisma.stage.create({ data: stageData });
    }
    console.log(`   Created ${stages.length} stages for project (all starting from scratch)`);
  } else {
    console.log('   Stages already exist for project, skipping creation (preserving your progress!)');
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
  // Note: Since project starts from scratch, we only create the initial activation payment
  // Stage payments will be created as stages are completed in real-time
  console.log('💳 Creating payments...');
  
  // Only create activation payment if project was just created
  if (project1WasCreated) {
    // Initial project activation payment (100% of budget to activate project)
    // This is required to activate the project, but stages start from scratch
    await prisma.payment.create({
      data: {
        projectId: project1.id,
        amount: 250000, // 100% of $250,000 budget - required for activation
        status: 'completed',
        method: 'stripe',
        transactionId: 'txn_activation_123456',
      },
    });
    console.log('   Created activation payment for project');
    // No stage payments - project starts from scratch, payments will be made as stages progress
  } else {
    console.log('   Payments already exist for project, skipping creation (preserving your progress!)');
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
  console.log('\nSubcontractors:');
  subcontractorsData.forEach((sub, index) => {
    console.log(`  ${index + 1}. ${sub.contractor.specialty}:`);
    console.log(`     Email: ${sub.email}`);
    console.log(`     Password: password123`);
  });
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



