
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTimeslots() {
  console.log('Adding time slots for 23rd Street Pizza...');

  const restaurantId = 'cmehl815g000112pvobdk27gy';
  const date = '2025-08-18';
  const times = ['21:30', '22:00', '23:00']; // 9:30PM, 10PM, 11PM in 24-hour format
  const partySizes = [2, 4];

  try {
    let totalSlots = 0;

    for (const time of times) {
      for (const partySize of partySizes) {
        await prisma.timeSlot.create({
          data: {
            restaurantId: restaurantId,
            date: date,
            time: time,
            partySize: partySize,
            status: 'AVAILABLE'
          }
        });
        totalSlots++;
        console.log(`✅ Created slot: ${date} ${time} for party of ${partySize}`);
      }
    }

    console.log(`\n🎉 Successfully added ${totalSlots} time slots for 23rd Street Pizza!`);
    console.log(`Date: ${date}`);
    console.log(`Times: 9:30 PM, 10:00 PM, 11:00 PM`);
    console.log(`Party sizes: 2, 4 people`);

  } catch (error) {
    console.error('❌ Error adding time slots:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTimeslots();
