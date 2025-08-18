
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

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

  // Create restaurants with complete data
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
      instagramUrl: "https://instagram.com/zlb23",
      website: "https://theleela.com",
      email: "zlb23@example.com",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'cocktails')?.id].filter(Boolean),
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
      instagramUrl: "https://instagram.com/soka",
      email: "soka@example.com",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'cocktails')?.id].filter(Boolean),
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
      email: "spiritforward@example.com",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'cocktails')?.id].filter(Boolean),
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
      instagramUrl: "https://instagram.com/naru",
      website: "https://naru.in",
      email: "naru@example.com",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'Japanese')?.id, createdCuisineTags.find(t => t.name === 'Thai')?.id].filter(Boolean),
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
      website: "https://pizza4ps.com",
      email: "indiranagar@pizza4ps.com",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'Italian')?.id].filter(Boolean),
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
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'cocktails')?.id].filter(Boolean),
    },
    {
      name: "The Permit Room",
      slug: "the-permit-room",
      emoji: "🍸",
      latitude: 12.9716,
      longitude: 77.5946,
      neighborhood: "Indiranagar",
      category: "cocktails",
      isHot: false,
      heroImageUrl: "/api/placeholder/400/300",
      email: "permitroom@example.com",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'cocktails')?.id].filter(Boolean),
    },
    {
      name: "Toit Brewpub",
      slug: "toit-brewpub",
      emoji: "🍺",
      latitude: 12.9352,
      longitude: 77.6245,
      neighborhood: "Koramangala",
      category: "dinner",
      isHot: true,
      heroImageUrl: "/api/placeholder/400/300",
      email: "toit@example.com",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'American')?.id].filter(Boolean),
    },
    {
      name: "Byg Brewski Brewing Company",
      slug: "byg-brewski-brewing-company",
      emoji: "🍺",
      latitude: 12.8438,
      longitude: 77.6632,
      neighborhood: "Sarjapur",
      category: "dinner",
      isHot: false,
      heroImageUrl: "/api/placeholder/400/300",
      email: "bygbrewski@example.com",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'American')?.id].filter(Boolean),
    },
    {
      name: "Truffles",
      slug: "truffles",
      emoji: "🍔",
      latitude: 12.9716,
      longitude: 77.5946,
      neighborhood: "Koramangala",
      category: "dinner",
      isHot: false,
      heroImageUrl: "/api/placeholder/400/300",
      email: "truffles@example.com",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'American')?.id].filter(Boolean),
    },
    {
      name: "Glen's Bakehouse",
      slug: "glens-bakehouse",
      emoji: "🥐",
      latitude: 12.9716,
      longitude: 77.5946,
      neighborhood: "Lavelle Road",
      category: "dinner",
      isHot: false,
      heroImageUrl: "/api/placeholder/400/300",
      email: "glens@example.com",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'Italian')?.id].filter(Boolean),
    },
    {
      name: "Koshy's",
      slug: "koshys",
      emoji: "☕",
      latitude: 12.9716,
      longitude: 77.5946,
      neighborhood: "St. Marks Road",
      category: "dinner",
      isHot: false,
      heroImageUrl: "/api/placeholder/400/300",
      email: "koshys@example.com",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'Indian')?.id].filter(Boolean),
    },
    {
      name: "Vidyarthi Bhavan",
      slug: "vidyarthi-bhavan",
      emoji: "🥘",
      latitude: 12.9716,
      longitude: 77.5946,
      neighborhood: "Basavanagudi",
      category: "dinner",
      isHot: true,
      heroImageUrl: "/api/placeholder/400/300",
      email: "vidyarthibhavan@example.com",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'Indian')?.id].filter(Boolean),
    },
    {
      name: "23rd Street Pizza",
      slug: "23rd-street-pizza",
      emoji: "🍕",
      latitude: 12.9679447,
      longitude: 77.6072707,
      neighborhood: "Koramangala",
      category: "dinner",
      isHot: false,
      heroImageUrl: "/api/placeholder/400/300",
      instagramUrl: "",
      website: "",
      email: "reservations@23rdstreetpizza.com",
      cuisineTagIds: [createdCuisineTags.find(t => t.name === 'dinner')?.id].filter(Boolean),
    }
  ];

  // Hash password for all restaurant auth records
  const hashedRestaurantPassword = await bcrypt.hash('restaurant123', 10);

  for (const restaurantData of restaurants) {
    const { cuisineTagIds, ...restaurant } = restaurantData;

    // Create or update restaurant
    const createdRestaurant = await prisma.restaurant.upsert({
      where: { slug: restaurant.slug },
      update: restaurant,
      create: restaurant,
    });

    // Connect cuisine tags if any
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

    // Create restaurant authentication record
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

    // Add some sample time slots for tomorrow and today
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];

    const timeSlots = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];
    const partySizes = [2, 4, 6, 8];

    // Add tomorrow's slots
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
    if (['zlb-23-at-the-leela-palace', 'soka', 'naru-noodle-bar'].includes(restaurant.slug)) {
      for (const time of timeSlots) {
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

  // Hash passwords for user authentication
  const hashedUserPassword1 = await bcrypt.hash('user123', 10);
  const hashedUserPassword2 = await bcrypt.hash('jane123', 10);

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
  console.log(`- ${restaurants.length} Restaurants with auth records`);
  console.log('- 2 Users with auth records');
  console.log('- Time slots for today and tomorrow');
  console.log('\n🔑 Restaurant Login Credentials:');
  console.log('Username: [restaurant-slug] | Password: restaurant123');
  console.log('Examples:');
  console.log('- zlb-23-at-the-leela-palace | restaurant123');
  console.log('- soka | restaurant123');
  console.log('- naru-noodle-bar | restaurant123');
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
