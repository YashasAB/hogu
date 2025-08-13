const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create cuisine tags first
  const cuisineTags = [
    { name: 'Italian' },
    { name: 'Japanese' },
    { name: 'Indian' },
    { name: 'American' },
    { name: 'Mediterranean' },
    { name: 'Chinese' },
    { name: 'Thai' },
    { name: 'Mexican' },
    { name: 'cocktails' },
    { name: 'dinner' },
    { name: 'hot' },
  ];

  const createdCuisineTags = [];
  for (const tag of cuisineTags) {
    const cuisineTag = await prisma.cuisineTag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
    createdCuisineTags.push(cuisineTag);
  }

  // Hash password for all restaurant auth records
  const hashedRestaurantPassword = await bcrypt.hash('restaurant123', 10);

  // Create restaurants with proper data
  const restaurants = [
    {
      name: "ZLB 23 (at The Leela Palace)",
      slug: "zlb-23-at-the-leela-palace",
      emoji: "🍸",
      latitude: 12.960695,
      longitude: 77.648663,
      neighborhood: "Old Airport Rd",
      category: "cocktails",
      isHot: true,
      heroImageUrl: "/api/placeholder/400/300",
      instagramUrl: "https://instagram.com/zlb23bangalore",
      website: "https://theleela.com/zlb23",
      email: "reservations@zlb23.com",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'cocktails').id], 
    },
    {
      name: "Soka",
      slug: "soka",
      emoji: "🍸",
      latitude: 12.965215,
      longitude: 77.638143,
      neighborhood: "Koramangala",
      category: "cocktails",
      isHot: false,
      heroImageUrl: "/api/placeholder/400/300",
      instagramUrl: "https://instagram.com/sokabangalore",
      website: "https://soka.in",
      email: "hello@soka.in",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'cocktails').id],
    },
    {
      name: "Bar Spirit Forward",
      slug: "bar-spirit-forward",
      emoji: "🥃",
      latitude: 12.975125,
      longitude: 77.602350,
      neighborhood: "CBD",
      category: "cocktails",
      isHot: true,
      heroImageUrl: "/api/placeholder/400/300",
      instagramUrl: "https://instagram.com/spiritforwardbangalore",
      website: "https://spiritforward.in",
      email: "reservations@spiritforward.in",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'cocktails').id],
    },
    {
      name: "Naru Noodle Bar",
      slug: "naru-noodle-bar",
      emoji: "🍱",
      latitude: 12.958431,
      longitude: 77.592895,
      neighborhood: "CBD",
      category: "dinner",
      isHot: false,
      heroImageUrl: "/api/placeholder/400/300",
      instagramUrl: "https://instagram.com/narunoodlebar",
      website: "https://naru.in",
      email: "reservations@naru.in",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'dinner').id],
    },
    {
      name: "Pizza 4P's (Indiranagar)",
      slug: "pizza-4ps-indiranagar",
      emoji: "🍕",
      latitude: 12.969968,
      longitude: 77.636089,
      neighborhood: "Indiranagar",
      category: "dinner",
      isHot: false,
      heroImageUrl: "/api/placeholder/400/300",
      instagramUrl: "https://instagram.com/pizza4ps",
      website: "https://pizza4ps.com",
      email: "indiranagar@pizza4ps.com",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'dinner').id],
    },
    {
      name: "Dali & Gala",
      slug: "dali-and-gala",
      emoji: "🍸",
      latitude: 12.975124,
      longitude: 77.602868,
      neighborhood: "CBD",
      category: "cocktails",
      isHot: false,
      heroImageUrl: "/api/placeholder/400/300",
      email: "daligala@example.com",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'cocktails').id],
    },
  ];

  // First, clean up any existing auth records for restaurants that don't exist
  console.log('Cleaning up orphaned restaurant auth records...');

  // Get all existing restaurants
  const existingRestaurants = await prisma.restaurant.findMany({
    select: { id: true, slug: true }
  });
  const existingRestaurantIds = new Set(existingRestaurants.map(r => r.id));

  // Delete auth records for restaurants that don't exist
  const orphanedAuthRecords = await prisma.restaurantAuth.findMany({
    where: {
      restaurantId: {
        notIn: Array.from(existingRestaurantIds)
      }
    }
  });

  if (orphanedAuthRecords.length > 0) {
    await prisma.restaurantAuth.deleteMany({
      where: {
        restaurantId: {
          notIn: Array.from(existingRestaurantIds)
        }
      }
    });
    console.log(`🗑️ Deleted ${orphanedAuthRecords.length} orphaned auth records`);
  }

  // Create/update restaurants and their auth records
  for (const restaurantData of restaurants) {
    const { cuisineTagIds, ...restaurant } = restaurantData;

    const createdRestaurant = await prisma.restaurant.upsert({
      where: { slug: restaurant.slug },
      update: restaurant,
      create: restaurant,
    });

    // Connect cuisine tags
    if (cuisineTagIds && cuisineTagIds.length > 0) {
      for (const tagId of cuisineTagIds) {
        await prisma.restaurantCuisineTag.upsert({
          where: {
            restaurantId_cuisineTagId: {
              restaurantId: createdRestaurant.id,
              cuisineTagId: tagId,
            },
          },
          update: {},
          create: {
            restaurantId: createdRestaurant.id,
            cuisineTagId: tagId,
          },
        });
      }
    }

    // Create restaurant authentication record only for restaurants that exist
    await prisma.restaurantAuth.upsert({
      where: { restaurantId: createdRestaurant.id },
      update: {},
      create: {
        restaurantId: createdRestaurant.id,
        username: restaurant.slug,
        passwordHash: hashedRestaurantPassword
      }
    });

    console.log(`✅ Created restaurant: ${restaurant.name} with auth record`);

    // Add some sample time slots for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

    // Add time slots for today
    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];

    const timeSlots = ['19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];
    const partySizes = [2, 4, 6];

    // Create slots for tomorrow for all restaurants
    for (const time of timeSlots) {
      for (const partySize of partySizes) {
        await prisma.timeSlot.upsert({
          where: {
            restaurantId_date_time_partySize: {
              restaurantId: createdRestaurant.id,
              date: tomorrowDateStr,
              time: time,
              partySize: partySize,
            },
          },
          update: {},
          create: {
            restaurantId: createdRestaurant.id,
            date: tomorrowDateStr,
            time: time,
            partySize: partySize,
            status: 'AVAILABLE',
          },
        });
      }
    }

    // Add today's slots for a few restaurants
    if (['zlb-23-at-the-leela-palace', 'soka', 'naru-noodle-bar'].includes(createdRestaurant.slug)) {
      const todayTimeSlots = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];
      for (const time of todayTimeSlots) {
        for (const partySize of partySizes) {
          await prisma.timeSlot.upsert({
            where: {
              restaurantId_date_time_partySize: {
                restaurantId: createdRestaurant.id,
                date: todayDateStr,
                time: time,
                partySize: partySize,
              },
            },
            update: {},
            create: {
              restaurantId: createdRestaurant.id,
              date: todayDateStr,
              time: time,
              partySize: partySize,
              status: 'AVAILABLE',
            },
          });
        }
      }
    }
  }

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

  // Final cleanup: ensure we only have auth records for existing restaurants
  const finalRestaurants = await prisma.restaurant.findMany({
    select: { id: true, slug: true }
  });
  const finalRestaurantIds = finalRestaurants.map(r => r.id);

  // Delete any remaining orphaned auth records
  await prisma.restaurantAuth.deleteMany({
    where: {
      restaurantId: {
        notIn: finalRestaurantIds
      }
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log('📊 Created:');
  console.log(`- ${restaurants.length} Restaurants with auth records`);
  console.log('- 2 Users');
  console.log('- Time slots for today and tomorrow');
  console.log('- Cleaned up orphaned auth records');
  console.log('\n🔑 Restaurant Login Credentials:');
  console.log('Username: [restaurant-slug] | Password: restaurant123');
  console.log('Examples:');
  console.log('- zlb-23-at-the-leela-palace | restaurant123');
  console.log('- soka | restaurant123');
  console.log('- naru-noodle-bar | restaurant123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });