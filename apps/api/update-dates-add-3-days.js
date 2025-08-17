
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addThreeDaysToAllDates() {
  try {
    console.log('Starting to add 3 days to all timeslot dates...');
    
    // First, get all time slots to see what we're working with
    const allSlots = await prisma.timeSlot.findMany({
      select: {
        id: true,
        date: true,
      }
    });
    
    console.log(`Found ${allSlots.length} time slots to update`);
    
    // Show current unique dates
    const uniqueDates = [...new Set(allSlots.map(slot => slot.date))].sort();
    console.log('Current dates in database:');
    uniqueDates.forEach(date => {
      console.log(`- ${date}`);
    });
    
    // Update each slot by adding 3 days to its date
    let updatedCount = 0;
    
    for (const slot of allSlots) {
      const currentDate = new Date(slot.date + 'T00:00:00'); // Parse as local date
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 3); // Add 3 days
      
      const newDateString = newDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      console.log(`Updating slot ${slot.id}: ${slot.date} -> ${newDateString}`);
      
      await prisma.timeSlot.update({
        where: { id: slot.id },
        data: { date: newDateString }
      });
      
      updatedCount++;
    }
    
    console.log(`\n✅ Successfully updated ${updatedCount} time slots!`);
    
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
    
    console.log('\nUpdated dates:');
    updatedSlots.forEach(slot => {
      console.log(`- ${slot.date}`);
    });
    
    // Show count of slots per date
    console.log('\nSlots count per updated date:');
    const finalUniqueDates = [...new Set(updatedSlots.map(slot => slot.date))].sort();
    for (const date of finalUniqueDates) {
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

addThreeDaysToAllDates();
