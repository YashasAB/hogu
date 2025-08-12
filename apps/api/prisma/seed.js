
const { PrismaClient } = require('@prisma/client');

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

  // Create restaurants with proper data
  const restaurants = [
    {
      name: "ZLB 23 (at The Leela Palace)",
      slug: "zlb",
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
      cuisineTagIds: [createdCuisineTags[4].id], // Mediterranean
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
      cuisineTagIds: [createdCuisineTags[1].id], // Japanese
    },
    {
      name: "Bar Spirit Forward",
      slug: "spirit-forward",
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
      cuisineTagIds: [createdCuisineTags[3].id], // American
    },
    {
      name: "Naru Noodle Bar",
      slug: "naru",
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
      cuisineTagIds: [createdCuisineTags[1].id, createdCuisineTags[6].id], // Japanese, Thai
    },
    {
      name: "Pizza 4P's (Indiranagar)",
      slug: "pizza-4ps",
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
      cuisineTagIds: [createdCuisineTags[0].id], // Italian
    },
    {
      name: "Demo Restaurant",
      slug: "demo-restaurant",
      emoji: "🏪",
      latitude: 12.971599,
      longitude: 77.594566,
      neighborhood: "Bangalore",
      category: "fine-dining",
      isHot: true,
      heroImageUrl: "/api/placeholder/400/300",
      instagramUrl: "https://instagram.com/demorestaurant",
      website: "https://demo-restaurant.com",
      email: "demo-restaurant@hogu.com",
      cuisineTagIds: [createdCuisineTags[2].id], // Indian
    },
  ];

  for (const restaurantData of restaurants) {
    const { cuisineTagIds, ...restaurant } = restaurantData;

    const createdRestaurant = await prisma.restaurant.upsert({
      where: { slug: restaurant.slug },
      update: restaurant,
      create: restaurant,
    });

    // Connect cuisine tags
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

    // Add some sample time slots for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

    // Add time slots for today
    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];

    const timeSlots = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'];
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

    // Add today's slots specifically for ZLB 23 (first restaurant - index 0)
    if (createdRestaurant.slug === 'zlb') {
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

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
