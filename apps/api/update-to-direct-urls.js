
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateToDirectUrls() {
  console.log('Starting to update all image URLs to direct Replit Object Storage format...');
  
  try {
    // Get all restaurants with heroImageUrl
    const restaurants = await prisma.restaurant.findMany({
      where: {
        heroImageUrl: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        heroImageUrl: true
      }
    });

    console.log(`Found ${restaurants.length} restaurants with images to update`);

    for (const restaurant of restaurants) {
      const oldUrl = restaurant.heroImageUrl;
      
      if (!oldUrl || oldUrl.startsWith('https://replit.com/object-storage/')) {
        console.log(`✓ ${restaurant.name}: Already using direct URL format`);
        continue;
      }

      let fileName = '';
      
      // Extract filename from different URL formats
      if (oldUrl.startsWith('/api/images/storage/')) {
        fileName = oldUrl.replace('/api/images/storage/', '');
      } else if (oldUrl.startsWith('https://storage.replit.com/')) {
        // Extract from full replit storage URL
        const urlParts = oldUrl.split('/');
        const bucketIndex = urlParts.findIndex(part => part.includes('-'));
        if (bucketIndex !== -1 && bucketIndex < urlParts.length - 2) {
          fileName = urlParts.slice(bucketIndex + 1).join('/');
        }
      } else if (oldUrl === '/api/placeholder/400/300') {
        console.log(`⏭️  ${restaurant.name}: Skipping placeholder image`);
        continue;
      } else {
        // Try to extract filename from any other format
        fileName = oldUrl.replace(/^\/*(api\/images\/)?/, '');
      }

      if (!fileName) {
        console.log(`⚠️  ${restaurant.name}: Could not extract filename from URL: ${oldUrl}`);
        continue;
      }

      // Construct the direct Replit Object Storage URL
      const encodedFileName = encodeURIComponent(fileName);
      const newUrl = `https://replit.com/object-storage/storage/v1/b/replit-objstore-0a421abc-4a91-43c3-a052-c47f2fa08f7a/o/${encodedFileName}?alt=media`;
      
      console.log(`Updating ${restaurant.name}:`);
      console.log(`  Old: ${oldUrl}`);
      console.log(`  New: ${newUrl}`);
      
      await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: { heroImageUrl: newUrl }
      });
    }

    console.log('✅ Successfully updated all image URLs to direct format');
  } catch (error) {
    console.error('❌ Error updating image URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateToDirectUrls();
