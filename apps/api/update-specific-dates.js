
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateSpecificDates() {
  try {
    console.log('Starting specific date updates...');
    
    // Update 2025-08-13 to 2025-08-15
    const update1 = await prisma.timeSlot.updateMany({
      where: {
        date: '2025-08-13'
      },
      data: {
        date: '2025-08-15'
      }
    });
    console.log(`Updated ${update1.count} slots from 2025-08-13 to 2025-08-15`);
    
    // Update 2025-08-14 to 2025-08-16
    const update2 = await prisma.timeSlot.updateMany({
      where: {
        date: '2025-08-14'
      },
      data: {
        date: '2025-08-16'
      }
    });
    console.log(`Updated ${update2.count} slots from 2025-08-14 to 2025-08-16`);
    
    console.log('All specific date updates completed successfully!');
    
    // Show the results
    const updatedSlots = await prisma.timeSlot.findMany({
      select: {
        date: true,
      },
      distinct: ['date'],
      orderBy: {
        date: 'asc'
      }
    });
    
    console.log('Current dates in database:');
    updatedSlots.forEach(slot => {
      console.log(`- ${slot.date}`);
    });
    
  } catch (error) {
    console.error('Error updating dates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSpecificDates();
