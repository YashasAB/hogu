
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addElevenPMSlot() {
  try {
    // First, find the ZLB restaurant by slug or name
    const zlbRestaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { slug: 'zlb-23-at-the-leela-palace' },
          { name: { contains: 'ZLB' } },
          { name: { contains: 'Leela Palace' } }
        ]
      }
    });

    if (!zlbRestaurant) {
      console.log('ZLB restaurant not found. Available restaurants:');
      const restaurants = await prisma.restaurant.findMany({
        select: { id: true, name: true, slug: true }
      });
      console.log(restaurants);
      return;
    }

    console.log(`Found ZLB restaurant: ${zlbRestaurant.name} (ID: ${zlbRestaurant.id})`);
    
    // Date: August 12th, 2025
    const date = '2025-08-12';
    
    // Time: 11:00 PM in 24-hour format
    const time = '23:00';
    
    // Party sizes to add slots for
    const partySizes = [2, 4, 6, 8];
    
    console.log(`Adding 11pm slots for ${zlbRestaurant.name} on ${date}...`);
    
    // Add slots for different party sizes
    for (const partySize of partySizes) {
      const slot = await prisma.timeSlot.create({
        data: {
          restaurantId: zlbRestaurant.id,
          date: date,
          time: time,
          partySize: partySize,
          status: 'AVAILABLE',
        },
      });
      
      console.log(`✅ Created slot: ${slot.id} for party size ${partySize}`);
    }
    
    console.log('Successfully added all 11pm slots for ZLB!');
    
  } catch (error) {
    console.error('Error adding 11pm slot:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addElevenPMSlot();
