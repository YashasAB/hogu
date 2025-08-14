
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAllImageUrls() {
  console.log('Starting comprehensive image URL fix...');
  
  try {
    // Get all restaurants
    const restaurants = await prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        heroImageUrl: true
      }
    });

    console.log(`Found ${restaurants.length} restaurants to check`);

    for (const restaurant of restaurants) {
      const oldUrl = restaurant.heroImageUrl;
      
      if (!oldUrl || oldUrl === '/api/placeholder/400/300') {
        console.log(`Skipping ${restaurant.name}: No image or placeholder`);
        continue;
      }

      let newUrl = oldUrl;
      let needsUpdate = false;

      // Handle different URL formats
      if (oldUrl.startsWith('https://storage.replit.com/')) {
        // Extract the path from the full URL
        const urlParts = oldUrl.split('/');
        const bucketIndex = urlParts.findIndex(part => part.includes('-'));
        if (bucketIndex !== -1 && bucketIndex < urlParts.length - 2) {
          const imagePath = urlParts.slice(bucketIndex + 1).join('/');
          newUrl = `/api/images/storage/${imagePath}`;
          needsUpdate = true;
        }
      } else if (oldUrl.startsWith('/api/images/') && !oldUrl.includes('/storage/')) {
        // Handle /api/images/path format
        const imagePath = oldUrl.replace('/api/images/', '');
        newUrl = `/api/images/storage/${imagePath}`;
        needsUpdate = true;
      } else if (!oldUrl.startsWith('/api/images/storage/') && !oldUrl.startsWith('/api/placeholder')) {
        // Handle any other formats
        const imagePath = oldUrl.replace(/^\/*(api\/images\/)?/, '');
        newUrl = `/api/images/storage/${imagePath}`;
        needsUpdate = true;
      }

      if (needsUpdate) {
        console.log(`Updating ${restaurant.name}:`);
        console.log(`  Old: ${oldUrl}`);
        console.log(`  New: ${newUrl}`);
        
        await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: { heroImageUrl: newUrl }
        });
      } else {
        console.log(`✓ ${restaurant.name}: URL format is correct`);
      }
    }

    console.log('Successfully updated all image URLs');
  } catch (error) {
    console.error('Error fixing image URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllImageUrls();
