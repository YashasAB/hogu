
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateDates() {
  try {
    console.log('Starting date updates...');
    
    // Update 2025-08-12 to 2025-08-13
    const update1 = await prisma.timeSlot.updateMany({
      where: {
        date: '2025-08-12'
      },
      data: {
        date: '2025-08-13'
      }
    });
    console.log(`Updated ${update1.count} slots from 2025-08-12 to 2025-08-13`);
    
    // Update 2025-08-13 to 2025-08-14 (this will update the original 08-13 entries)
    const update2 = await prisma.timeSlot.updateMany({
      where: {
        date: '2025-08-13'
      },
      data: {
        date: '2025-08-14'
      }
    });
    console.log(`Updated ${update2.count} slots from 2025-08-13 to 2025-08-14`);
    
    // Update 2025-08-14 to 2025-08-15 (this will update the original 08-14 entries)
    const update3 = await prisma.timeSlot.updateMany({
      where: {
        date: '2025-08-14'
      },
      data: {
        date: '2025-08-15'
      }
    });
    console.log(`Updated ${update3.count} slots from 2025-08-14 to 2025-08-15`);
    
    console.log('All date updates completed successfully!');
    
  } catch (error) {
    console.error('Error updating dates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDates();
