import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create cuisine tags first
  const cocktailsTag = await prisma.cuisineTag.upsert({
    where: { name: 'cocktails' },
    update: {},
    create: { name: 'cocktails' },
  });

  const dinnerTag = await prisma.cuisineTag.upsert({
    where: { name: 'dinner' },
    update: {},
    create: { name: 'dinner' },
  });

  const hotTag = await prisma.cuisineTag.upsert({
    where: { name: 'hot' },
    update: {},
    create: { name: 'hot' },
  });

  // Create restaurants
  const restaurants = [
    {
      name: "ZLB 23 (at The Leela Palace)",
      slug: "zlb-23",
      emoji: "🍸",
      latitude: 12.960695,
      longitude: 77.648663,
      neighborhood: "Old Airport Rd",
      category: "cocktails",
      isHot: true,
      heroImageUrl: "/api/placeholder/400/300",
      instagramUrl: "https://instagram.com/zlb23",
      website: "https://theleela.com",
      email: "reservations@zlb23.com",
      cuisineTagIds: [cocktailsTag.id, hotTag.id],
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
      email: "hello@soka.in",
      cuisineTagIds: [cocktailsTag.id],
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
      email: "reservations@spiritforward.in",
      cuisineTagIds: [cocktailsTag.id, hotTag.id],
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
      email: "reservations@naru.in",
      cuisineTagIds: [dinnerTag.id],
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
      cuisineTagIds: [dinnerTag.id],
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
    const dateStr = tomorrow.toISOString().split('T')[0];

    const timeSlots = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'];
    const partySizes = [2, 4, 6];

    for (const time of timeSlots) {
      for (const partySize of partySizes) {
        await prisma.timeSlot.upsert({
          where: {
            restaurantId_date_time_partySize: {
              restaurantId: createdRestaurant.id,
              date: dateStr,
              time: time,
              partySize: partySize,
            },
          },
          update: {},
          create: {
            restaurantId: createdRestaurant.id,
            date: dateStr,
            time: time,
            partySize: partySize,
            status: 'AVAILABLE',
          },
        });
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