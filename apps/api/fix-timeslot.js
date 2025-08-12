
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTimeSlot() {
  try {
    // First, let's see what the current value is
    const slot = await prisma.timeSlot.findUnique({
      where: { id: 'cme935fv50001nn3sf2cqlvyd' }
    });
    
    console.log('Current slot:', slot);
    
    if (slot && slot.time) {
      let fixedTime = slot.time;
      
      // Convert 12-hour format to 24-hour format
      if (slot.time.includes('PM') || slot.time.includes('AM')) {
        const timeMatch = slot.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2];
          const period = timeMatch[3].toUpperCase();
          
          if (period === 'PM' && hours !== 12) {
            hours += 12;
          } else if (period === 'AM' && hours === 12) {
            hours = 0;
          }
          
          fixedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
      }
      
      console.log('Fixing time from:', slot.time, 'to:', fixedTime);
      
      // Update the time slot
      const updated = await prisma.timeSlot.update({
        where: { id: 'cme935fv50001nn3sf2cqlvyd' },
        data: { time: fixedTime }
      });
      
      console.log('Updated slot:', updated);
    } else {
      console.log('Slot not found or has no time value');
    }
  } catch (error) {
    console.error('Error fixing time slot:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTimeSlot();
