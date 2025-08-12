
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample restaurants
  const restaurant1 = await prisma.restaurant.upsert({
    where: { slug: 'demo-restaurant' },
    update: {},
    create: {
      name: 'Demo Restaurant',
      slug: 'demo-restaurant',
      emoji: '🍽️',
      latitude: 12.9716,
      longitude: 77.5946,
      neighborhood: 'Indiranagar',
      category: 'dinner',
      isHot: true,
      email: 'demo@restaurant.com',
      website: 'https://demo-restaurant.com'
    }
  });

  const restaurant2 = await prisma.restaurant.upsert({
    where: { slug: 'sample-bar' },
    update: {},
    create: {
      name: 'Sample Bar',
      slug: 'sample-bar',
      emoji: '🍸',
      latitude: 12.9352,
      longitude: 77.6245,
      neighborhood: 'Koramangala',
      category: 'cocktails',
      isHot: false,
      email: 'hello@samplebar.com'
    }
  });

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
      phone: '+919876543210'
    }
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      phone: '+919876543211'
    }
  });

  // Hash passwords for authentication
  const hashedRestaurantPassword = await bcrypt.hash('restaurant123', 10);
  const hashedUserPassword1 = await bcrypt.hash('user123', 10);
  const hashedUserPassword2 = await bcrypt.hash('jane123', 10);

  // Create restaurant authentication records
  await prisma.restaurantAuth.upsert({
    where: { restaurantId: restaurant1.id },
    update: {},
    create: {
      restaurantId: restaurant1.id,
      username: 'demo-restaurant',
      passwordHash: hashedRestaurantPassword
    }
  });

  await prisma.restaurantAuth.upsert({
    where: { restaurantId: restaurant2.id },
    update: {},
    create: {
      restaurantId: restaurant2.id,
      username: 'sample-bar',
      passwordHash: hashedRestaurantPassword
    }
  });

  // Create user authentication records
  await prisma.userAuth.upsert({
    where: { userId: user1.id },
    update: {},
    create: {
      userId: user1.id,
      username: 'johndoe',
      passwordHash: hashedUserPassword1
    }
  });

  await prisma.userAuth.upsert({
    where: { userId: user2.id },
    update: {},
    create: {
      userId: user2.id,
      username: 'janesmith',
      passwordHash: hashedUserPassword2
    }
  });

  // Create user detail records
  await prisma.userDetail.upsert({
    where: { userId: user1.id },
    update: {},
    create: {
      userId: user1.id,
      name: 'John Doe',
      phoneNumber: '+919876543210',
      email: 'john@example.com',
      preferredHood: 'Indiranagar'
    }
  });

  await prisma.userDetail.upsert({
    where: { userId: user2.id },
    update: {},
    create: {
      userId: user2.id,
      name: 'Jane Smith',
      phoneNumber: '+919876543211',
      email: 'jane@example.com',
      preferredHood: 'Koramangala'
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log('📊 Created:');
  console.log('- 2 Restaurants');
  console.log('- 2 Users');
  console.log('- 2 Restaurant Auth records');
  console.log('- 2 User Auth records');
  console.log('- 2 User Detail records');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
