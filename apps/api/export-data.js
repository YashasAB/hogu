
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('Exporting data...');
    
    const data = {
      restaurants: await prisma.restaurant.findMany({
        include: {
          cuisineTags: true,
          timeSlots: true,
          reservations: true
        }
      }),
      users: await prisma.user.findMany({
        include: {
          reservations: true,
          auth: true,
          details: true
        }
      }),
      cuisineTags: await prisma.cuisineTag.findMany()
    };
    
    fs.writeFileSync('data-export.json', JSON.stringify(data, null, 2));
    console.log('Data exported to data-export.json');
  } catch (error) {
    console.error('Export error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function importData() {
  try {
    if (!fs.existsSync('data-export.json')) {
      console.log('No data-export.json file found');
      return;
    }
    
    console.log('Importing data...');
    const data = JSON.parse(fs.readFileSync('data-export.json', 'utf8'));
    
    // Clear existing data
    await prisma.reservation.deleteMany();
    await prisma.timeSlot.deleteMany();
    await prisma.restaurantCuisineTag.deleteMany();
    await prisma.userAuth.deleteMany();
    await prisma.userDetail.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
    await prisma.cuisineTag.deleteMany();
    
    // Import cuisine tags first
    for (const tag of data.cuisineTags) {
      await prisma.cuisineTag.create({
        data: { id: tag.id, name: tag.name }
      });
    }
    
    // Import restaurants
    for (const restaurant of data.restaurants) {
      const { cuisineTags, timeSlots, reservations, ...restaurantData } = restaurant;
      await prisma.restaurant.create({ data: restaurantData });
    }
    
    console.log('Data imported successfully!');
  } catch (error) {
    console.error('Import error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run export or import based on command line argument
const command = process.argv[2];
if (command === 'export') {
  exportData();
} else if (command === 'import') {
  importData();
} else {
  console.log('Usage: node export-data.js [export|import]');
}
