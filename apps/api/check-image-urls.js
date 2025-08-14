
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkImageUrls() {
  console.log('Checking current image URLs in database...');
  
  try {
    const restaurants = await prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        heroImageUrl: true
      }
    });

    console.log(`Found ${restaurants.length} restaurants:`);
    
    for (const restaurant of restaurants) {
      console.log(`${restaurant.name}: ${restaurant.heroImageUrl || 'No image URL'}`);
    }

  } catch (error) {
    console.error('Error checking image URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImageUrls();
