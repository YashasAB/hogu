
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const restaurants = [
  {
    name: "ZLB 23 (at The Leela Palace)",
    slug: "zlb",
    emoji: "🍸",
    latitude: 12.960695,
    longitude: 77.648663,
    neighborhood: "Old Airport Road",
    category: "cocktails",
    isHot: true,
    heroImageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
    instagramUrl: "https://instagram.com/zlb23",
    website: "https://theleela.com",
    cuisineTags: ["Cocktails", "Fine Dining", "Rooftop"],
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
    heroImageUrl: "https://images.unsplash.com/photo-1528605105345-5344ea20e269?q=80&w=1600&auto=format&fit=crop",
    instagramUrl: "https://instagram.com/soka",
    cuisineTags: ["Cocktails", "Asian Fusion"],
  },
  {
    name: "Bar Spirit Forward",
    slug: "spirit-forward",
    emoji: "🥃",
    latitude: 12.975125,
    longitude: 77.60235,
    neighborhood: "CBD",
    category: "cocktails",
    isHot: true,
    heroImageUrl: "https://images.unsplash.com/photo-1542326237-94b1c5a538d8?q=80&w=1600&auto=format&fit=crop",
    instagramUrl: "https://instagram.com/spiritforward",
    cuisineTags: ["Cocktails", "Whiskey", "Bar"],
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
    heroImageUrl: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=1600&auto=format&fit=crop",
    instagramUrl: "https://instagram.com/naru",
    cuisineTags: ["Japanese", "Noodles", "Asian"],
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
    heroImageUrl: "https://images.unsplash.com/photo-1541745537413-b804d1a57a51?q=80&w=1600&auto=format&fit=crop",
    instagramUrl: "https://instagram.com/pizza4ps",
    cuisineTags: ["Pizza", "Italian", "Cheese"],
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
    heroImageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1600&auto=format&fit=crop",
    instagramUrl: "https://instagram.com/daligala",
    cuisineTags: ["Cocktails", "Art", "Modern"],
  },
];

async function main() {
  console.log('Start seeding...');

  // Create cuisine tags first
  const cuisineTagsSet = new Set<string>();
  restaurants.forEach(r => r.cuisineTags.forEach(tag => cuisineTagsSet.add(tag)));
  
  const cuisineTags = Array.from(cuisineTagsSet);
  for (const tagName of cuisineTags) {
    await prisma.cuisineTag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });
  }

  // Create restaurants with cuisine tag relations
  for (const restaurantData of restaurants) {
    const { cuisineTags: tagNames, ...restaurantInfo } = restaurantData;
    
    const restaurant = await prisma.restaurant.upsert({
      where: { slug: restaurantInfo.slug },
      update: restaurantInfo,
      create: restaurantInfo,
    });

    // Connect cuisine tags
    for (const tagName of tagNames) {
      const tag = await prisma.cuisineTag.findUnique({ where: { name: tagName } });
      if (tag) {
        await prisma.restaurantCuisineTag.upsert({
          where: {
            restaurantId_cuisineTagId: {
              restaurantId: restaurant.id,
              cuisineTagId: tag.id,
            },
          },
          update: {},
          create: {
            restaurantId: restaurant.id,
            cuisineTagId: tag.id,
          },
        });
      }
    }

    // Create sample time slots for the next 7 days
    const times = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];
    const partySizes = [1, 2, 3, 4, 5, 6];
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      const dateStr = date.toISOString().split('T')[0];
      
      for (const time of times) {
        for (const partySize of partySizes) {
          await prisma.timeSlot.upsert({
            where: {
              restaurantId_date_time_partySize: {
                restaurantId: restaurant.id,
                date: dateStr,
                time: time,
                partySize: partySize,
              },
            },
            update: {},
            create: {
              restaurantId: restaurant.id,
              date: dateStr,
              time: time,
              partySize: partySize,
              status: Math.random() > 0.3 ? 'AVAILABLE' : 'FULL',
            },
          });
        }
      }
    }
  }

  console.log('Seeding finished.');
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
