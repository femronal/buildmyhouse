import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedMarketplace() {
  console.log('🏪 Seeding marketplace data...');

  // Create vendor users first
  const vendor1 = await prisma.user.upsert({
    where: { email: 'vendor1@buildmyhouse.com' },
    update: {},
    create: {
      email: 'vendor1@buildmyhouse.com',
      password: '$2b$10$YourHashedPasswordHere', // password123
      fullName: 'Dangote Cement Nigeria',
      role: 'vendor',
      verified: true,
    },
  });

  const vendor2 = await prisma.user.upsert({
    where: { email: 'vendor2@buildmyhouse.com' },
    update: {},
    create: {
      email: 'vendor2@buildmyhouse.com',
      password: '$2b$10$YourHashedPasswordHere',
      fullName: 'BUA Steel Company',
      role: 'vendor',
      verified: true,
    },
  });

  const vendor3 = await prisma.user.upsert({
    where: { email: 'vendor3@buildmyhouse.com' },
    update: {},
    create: {
      email: 'vendor3@buildmyhouse.com',
      password: '$2b$10$YourHashedPasswordHere',
      fullName: 'BuildCo Supplies',
      role: 'vendor',
      verified: true,
    },
  });

  // Seed Materials
  const materials = [
    // Cement
    {
      name: 'Premium Portland Cement',
      brand: 'Dangote',
      description: 'High-quality Portland cement suitable for all construction needs. Grade 42.5R with excellent strength properties.',
      category: 'cement',
      price: 4500,
      unit: 'bag (50kg)',
      stock: 500,
      rating: 4.8,
      reviews: 234,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      vendorId: vendor1.id,
    },
    {
      name: 'Ordinary Portland Cement',
      brand: 'Lafarge',
      description: 'Standard quality cement for general construction. OPC 42.5N grade.',
      category: 'cement',
      price: 4200,
      unit: 'bag (50kg)',
      stock: 800,
      rating: 4.5,
      reviews: 189,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      vendorId: vendor1.id,
    },
    // Steel
    {
      name: 'High Tensile Rebar 12mm',
      brand: 'BUA Steel',
      description: 'Grade 500 high tensile steel reinforcement bars. Corrosion resistant with excellent weldability.',
      category: 'steel',
      price: 850,
      unit: 'per meter',
      stock: 2000,
      rating: 4.9,
      reviews: 156,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&q=80',
      vendorId: vendor2.id,
    },
    {
      name: 'High Tensile Rebar 16mm',
      brand: 'BUA Steel',
      description: 'Grade 500 high tensile steel reinforcement bars for heavy structural work.',
      category: 'steel',
      price: 1200,
      unit: 'per meter',
      stock: 1500,
      rating: 4.8,
      reviews: 142,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&q=80',
      vendorId: vendor2.id,
    },
    // Wood
    {
      name: 'Treated Hardwood Timber',
      brand: 'Forest Products',
      description: 'Pressure-treated hardwood suitable for roofing and structural applications. Termite and rot resistant.',
      category: 'wood',
      price: 3500,
      unit: 'per plank (12ft)',
      stock: 300,
      rating: 4.6,
      reviews: 98,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1518803194621-27188ba362c9?w=600&q=80',
      vendorId: vendor3.id,
    },
    {
      name: 'Marine Plywood 18mm',
      brand: 'WoodTech',
      description: 'Premium marine grade plywood. Waterproof and suitable for formwork and concrete casting.',
      category: 'wood',
      price: 12500,
      unit: 'per sheet (8ft x 4ft)',
      stock: 150,
      rating: 4.7,
      reviews: 76,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1518803194621-27188ba362c9?w=600&q=80',
      vendorId: vendor3.id,
    },
    // Paint
    {
      name: 'Exterior Emulsion Paint',
      brand: 'Dulux',
      description: 'Weather-resistant exterior emulsion paint. UV protection and anti-fungal properties. Available in various colors.',
      category: 'paint',
      price: 18500,
      unit: '20 liters',
      stock: 200,
      rating: 4.8,
      reviews: 167,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80',
      vendorId: vendor3.id,
    },
    // Tiles
    {
      name: 'Porcelain Floor Tiles 60x60cm',
      brand: 'Royal Ceramics',
      description: 'Premium porcelain floor tiles with marble finish. Slip-resistant and easy to maintain.',
      category: 'tiles',
      price: 3200,
      unit: 'per square meter',
      stock: 500,
      rating: 4.9,
      reviews: 213,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1615529162924-f8605388461d?w=600&q=80',
      vendorId: vendor3.id,
    },
    // Plumbing
    {
      name: 'PVC Pipes 4-inch',
      brand: 'JDP',
      description: 'Heavy-duty PVC pipes for sewage and drainage. UV stabilized and chemical resistant.',
      category: 'plumbing',
      price: 4500,
      unit: '6 meters',
      stock: 400,
      rating: 4.5,
      reviews: 121,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1607400201515-c2c41c07a98c?w=600&q=80',
      vendorId: vendor3.id,
    },
    {
      name: 'Water Tank 1000L',
      brand: 'Sintex',
      description: 'Food-grade polyethylene water storage tank. UV stabilized with 5-year warranty.',
      category: 'plumbing',
      price: 45000,
      unit: 'per unit',
      stock: 50,
      rating: 4.7,
      reviews: 89,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&q=80',
      vendorId: vendor3.id,
    },
    // Electrical
    {
      name: 'Copper Electrical Wire 2.5mm',
      brand: 'Kablemetal',
      description: 'Pure copper electrical wire suitable for residential and commercial installations.',
      category: 'electrical',
      price: 280,
      unit: 'per meter',
      stock: 5000,
      rating: 4.6,
      reviews: 145,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&q=80',
      vendorId: vendor2.id,
    },
    // Fixtures
    {
      name: 'LED Ceiling Light',
      brand: 'Philips',
      description: 'Energy-efficient LED ceiling light. 40W equivalent, 3000K warm white. 50,000 hour lifespan.',
      category: 'fixtures',
      price: 8500,
      unit: 'per unit',
      stock: 120,
      rating: 4.8,
      reviews: 178,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&q=80',
      vendorId: vendor3.id,
    },
  ];

  for (const material of materials) {
    await prisma.material.upsert({
      where: {
        // Use a combination that makes sense for your unique constraint
        id: material.name + '-' + material.brand,
      },
      update: material,
      create: material,
    });
  }

  console.log(`✅ Created ${materials.length} materials`);

  // Create contractor users
  const contractor1User = await prisma.user.upsert({
    where: { email: 'contractor1@buildmyhouse.com' },
    update: {},
    create: {
      email: 'contractor1@buildmyhouse.com',
      password: '$2b$10$YourHashedPasswordHere',
      fullName: 'John Smith',
      phone: '+234 803 123 4567',
      role: 'general_contractor',
      verified: true,
    },
  });

  const contractor2User = await prisma.user.upsert({
    where: { email: 'contractor2@buildmyhouse.com' },
    update: {},
    create: {
      email: 'contractor2@buildmyhouse.com',
      password: '$2b$10$YourHashedPasswordHere',
      fullName: 'Ahmed Ibrahim',
      phone: '+234 806 234 5678',
      role: 'general_contractor',
      verified: true,
    },
  });

  const contractor3User = await prisma.user.upsert({
    where: { email: 'contractor3@buildmyhouse.com' },
    update: {},
    create: {
      email: 'contractor3@buildmyhouse.com',
      password: '$2b$10$YourHashedPasswordHere',
      fullName: 'Chidi Okafor',
      phone: '+234 809 345 6789',
      role: 'subcontractor',
      verified: true,
    },
  });

  const contractor4User = await prisma.user.upsert({
    where: { email: 'contractor4@buildmyhouse.com' },
    update: {},
    create: {
      email: 'contractor4@buildmyhouse.com',
      password: '$2b$10$YourHashedPasswordHere',
      fullName: 'Grace Adeyemi',
      phone: '+234 802 456 7890',
      role: 'subcontractor',
      verified: true,
    },
  });

  // Seed Contractors
  const contractors = [
    {
      userId: contractor1User.id,
      name: 'Smith Concrete Co',
      specialty: 'Foundation & Structural Work',
      description: 'Specialized in concrete foundations, structural reinforcement, and groundworks. 15 years of experience with 200+ completed projects.',
      location: 'Lagos, Nigeria',
      rating: 4.9,
      reviews: 156,
      projects: 234,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80',
      hiringFee: 250000,
      type: 'general_contractor',
    },
    {
      userId: contractor2User.id,
      name: 'Ibrahim Construction Ltd',
      specialty: 'Complete Building Construction',
      description: 'Full-service general contractor specializing in residential and commercial buildings. Licensed and insured.',
      location: 'Abuja, Nigeria',
      rating: 4.8,
      reviews: 189,
      projects: 312,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
      hiringFee: 500000,
      type: 'general_contractor',
    },
    {
      userId: contractor3User.id,
      name: 'Okafor Electrical Services',
      specialty: 'Electrical Installation & Wiring',
      description: 'Licensed electrician with expertise in residential and commercial electrical systems. Solar panel installation available.',
      location: 'Port Harcourt, Nigeria',
      rating: 4.7,
      reviews: 124,
      projects: 178,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80',
      hiringFee: 150000,
      type: 'subcontractor',
    },
    {
      userId: contractor4User.id,
      name: 'Adeyemi Plumbing Works',
      specialty: 'Plumbing & Water Systems',
      description: 'Expert plumbing services including pipe installation, drainage systems, and water treatment solutions.',
      location: 'Ibadan, Nigeria',
      rating: 4.8,
      reviews: 142,
      projects: 201,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80',
      hiringFee: 120000,
      type: 'subcontractor',
    },
  ];

  for (const contractor of contractors) {
    await prisma.contractor.upsert({
      where: { userId: contractor.userId },
      update: contractor,
      create: contractor,
    });
  }

  console.log(`✅ Created ${contractors.length} contractors`);
  console.log('✅ Marketplace seeding complete!');
}

