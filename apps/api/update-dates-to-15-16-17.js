
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateDatesToNewRange() {
  try {
    console.log('Starting to update time slot dates to 15th, 16th, and 17th...');
    
    // First, get all unique dates currently in the database
    const currentDates = await prisma.timeSlot.findMany({
      select: {
        date: true,
      },
      distinct: ['date'],
      orderBy: {
        date: 'asc'
      }
    });
    
    console.log('Current dates in database:');
    currentDates.forEach(slot => {
      console.log(`- ${slot.date}`);
    });
    
    // Get the year and month from the first date to maintain consistency
    const firstDate = currentDates[0]?.date;
    if (!firstDate) {
      console.log('No time slots found in database');
      return;
    }
    
    const dateObj = new Date(firstDate + 'T00:00:00');
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    
    // Target dates: 15th, 16th, 17th
    const targetDates = [
      `${year}-${month}-15`,
      `${year}-${month}-16`,
      `${year}-${month}-17`
    ];
    
    console.log('\nTarget dates:');
    targetDates.forEach(date => {
      console.log(`- ${date}`);
    });
    
    // Update slots in batches based on current dates
    const sortedCurrentDates = currentDates.map(d => d.date).sort();
    
    for (let i = 0; i < Math.min(sortedCurrentDates.length, targetDates.length); i++) {
      const currentDate = sortedCurrentDates[i];
      const targetDate = targetDates[i];
      
      console.log(`\nUpdating slots from ${currentDate} to ${targetDate}...`);
      
      const updateResult = await prisma.timeSlot.updateMany({
        where: {
          date: currentDate
        },
        data: {
          date: targetDate
        }
      });
      
      console.log(`✅ Updated ${updateResult.count} slots from ${currentDate} to ${targetDate}`);
    }
    
    console.log('\n🎉 All date updates completed successfully!');
    
    // Show final results
    const updatedSlots = await prisma.timeSlot.findMany({
      select: {
        date: true,
      },
      distinct: ['date'],
      orderBy: {
        date: 'asc'
      }
    });
    
    console.log('\nFinal dates in database:');
    updatedSlots.forEach(slot => {
      console.log(`- ${slot.date}`);
    });
    
    // Show count of slots per date
    console.log('\nSlots count per date:');
    for (const date of targetDates) {
      const count = await prisma.timeSlot.count({
        where: { date }
      });
      console.log(`- ${date}: ${count} slots`);
    }
    
  } catch (error) {
    console.error('Error updating dates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDatesToNewRange();
