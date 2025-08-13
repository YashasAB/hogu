
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addElevenPMSlot() {
  try {
    // ZLB restaurant ID from the database
    const zlbRestaurantId = 'cme8zim2a0008zuk6bcd1nzsu';
    
    // Date: August 12th, 2025
    const date = '2025-08-12';
    
    // Time: 11:00 PM in 24-hour format
    const time = '23:00';
    
    // Party sizes to add slots for
    const partySizes = [2, 4, 6, 8];
    
    console.log(`Adding 11pm slots for ZLB on ${date}...`);
    
    // Add slots for different party sizes
    for (const partySize of partySizes) {
      const slot = await prisma.timeSlot.create({
        data: {
          restaurantId: zlbRestaurantId,
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
