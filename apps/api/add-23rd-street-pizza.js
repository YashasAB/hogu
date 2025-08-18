
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function add23rdStreetPizza() {
  console.log('Adding 23rd Street Pizza restaurant...');

  try {
    // Find or create the "dinner" cuisine tag
    let dinnerTag = await prisma.cuisineTag.findUnique({
      where: { name: 'dinner' }
    });

    if (!dinnerTag) {
      dinnerTag = await prisma.cuisineTag.create({
        data: { name: 'dinner' }
      });
      console.log('✅ Created "dinner" cuisine tag');
    }

    // Find or create the "wine" cuisine tag
    let wineTag = await prisma.cuisineTag.findUnique({
      where: { name: 'wine' }
    });

    if (!wineTag) {
      wineTag = await prisma.cuisineTag.create({
        data: { name: 'wine' }
      });
      console.log('✅ Created "wine" cuisine tag');
    }

    // Create the restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        name: "23rd Street Pizza",
        slug: "23rd-street-pizza",
        emoji: "🍕",
        latitude: 12.9679447,
        longitude: 77.6072707,
        neighborhood: "Koramangala",
        category: "dinner",
        isHot: false,
        heroImageUrl: "/api/placeholder/400/300", // Placeholder until user uploads
        instagramUrl: "",
        website: "",
        email: "reservations@23rdstreetpizza.com"
      }
    });

    console.log(`✅ Created restaurant: ${restaurant.name} (ID: ${restaurant.id})`);

    // Connect cuisine tags
    await prisma.restaurantCuisineTag.createMany({
      data: [
        {
          restaurantId: restaurant.id,
          cuisineTagId: dinnerTag.id
        },
        {
          restaurantId: restaurant.id,
          cuisineTagId: wineTag.id
        }
      ]
    });

    console.log('✅ Connected cuisine tags (dinner, wine)');

    // Create restaurant authentication
    const hashedPassword = await bcrypt.hash('23pizza', 10);
    await prisma.restaurantAuth.create({
      data: {
        restaurantId: restaurant.id,
        username: '23pizza',
        passwordHash: hashedPassword
      }
    });

    console.log('✅ Created restaurant auth (username: 23pizza, password: 23pizza)');

    // Create time slots for the specified dates
    const dates = [
      '2025-08-19',
      '2025-08-20',
      '2025-08-21',
      '2025-08-22',
      '2025-08-23',
      '2025-08-24'
    ];

    // Generate time slots from 10:00 AM to 11:00 PM (every 30 minutes)
    const timeSlots = [];
    for (let hour = 10; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 23 && minute > 0) break; // Stop at 11:00 PM
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        timeSlots.push(timeString);
      }
    }

    const partySizes = [2, 4, 6];
    let totalSlots = 0;

    for (const date of dates) {
      for (const time of timeSlots) {
        for (const partySize of partySizes) {
          await prisma.timeSlot.create({
            data: {
              restaurantId: restaurant.id,
              date: date,
              time: time,
              partySize: partySize,
              status: 'AVAILABLE'
            }
          });
          totalSlots++;
        }
      }
    }

    console.log(`✅ Created ${totalSlots} time slots across ${dates.length} days`);
    console.log(`   - Time slots: 10:00 AM to 11:00 PM (every 30 minutes)`);
    console.log(`   - Party sizes: 2, 4, 6 people`);
    console.log(`   - Dates: ${dates.join(', ')}`);

    console.log('\n🎉 Successfully added 23rd Street Pizza restaurant!');
    console.log('\nRestaurant Details:');
    console.log(`- Name: ${restaurant.name}`);
    console.log(`- Slug: ${restaurant.slug}`);
    console.log(`- Location: (${restaurant.latitude}, ${restaurant.longitude})`);
    console.log(`- Category: ${restaurant.category}`);
    console.log(`- Cuisine Tags: dinner, wine`);
    console.log(`- Auth Username: 23pizza`);
    console.log(`- Auth Password: 23pizza`);
    console.log(`- Total Time Slots: ${totalSlots}`);

  } catch (error) {
    console.error('❌ Error adding restaurant:', error);
  } finally {
    await prisma.$disconnect();
  }
}

add23rdStreetPizza();
