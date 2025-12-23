/**
 * Script to create an admin user
 * Run with: npx ts-node src/auth/create-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.argv[2] || 'admin@buildmyhouse.com';
  const password = process.argv[3] || 'admin123';
  const fullName = process.argv[4] || 'Admin User';

  try {
    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log(`User with email ${email} already exists.`);
      console.log('You can login with this email.');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: 'admin',
        verified: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`User ID: ${admin.id}`);
    console.log('\nYou can now login to the admin dashboard with these credentials.');
  } catch (error: any) {
    console.error('Error creating admin user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();


