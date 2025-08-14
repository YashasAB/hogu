
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixImageUrls() {
  console.log('Starting to fix image URLs...');
  
  try {
    // Get all restaurants with heroImageUrl that starts with /api/images/
    const restaurants = await prisma.restaurant.findMany({
      where: {
        heroImageUrl: {
          startsWith: '/api/images/'
        }
      }
    });

    console.log(`Found ${restaurants.length} restaurants with old image URLs`);

    for (const restaurant of restaurants) {
      const oldUrl = restaurant.heroImageUrl;
      
      // Extract the path after /api/images/
      const imagePath = oldUrl.replace('/api/images/', '');
      
      // Create the new proxy URL
      const newUrl = `/api/images/storage/${imagePath}`;
      
      console.log(`Updating ${restaurant.name}:`);
      console.log(`  Old: ${oldUrl}`);
      console.log(`  New: ${newUrl}`);
      
      // Update the restaurant
      await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: { heroImageUrl: newUrl }
      });
    }

    console.log('Successfully updated all image URLs');
  } catch (error) {
    console.error('Error fixing image URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixImageUrls();
