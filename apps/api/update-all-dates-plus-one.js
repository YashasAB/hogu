
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAllDates() {
  try {
    console.log('Starting to update all dates by adding +1 day...');
    
    // First, get all time slots to see what we're working with
    const allSlots = await prisma.timeSlot.findMany({
      select: {
        id: true,
        date: true,
      }
    });
    
    console.log(`Found ${allSlots.length} time slots to update`);
    
    // Update each slot by adding one day to its date
    let updatedCount = 0;
    
    for (const slot of allSlots) {
      const currentDate = new Date(slot.date + 'T00:00:00'); // Parse as local date
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 1); // Add 1 day
      
      const newDateString = newDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      console.log(`Updating slot ${slot.id}: ${slot.date} -> ${newDateString}`);
      
      await prisma.timeSlot.update({
        where: { id: slot.id },
        data: { date: newDateString }
      });
      
      updatedCount++;
    }
    
    console.log(`Successfully updated ${updatedCount} time slots!`);
    
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
    
    console.log('Updated dates:');
    updatedSlots.forEach(slot => {
      console.log(`- ${slot.date}`);
    });
    
  } catch (error) {
    console.error('Error updating dates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAllDates();
