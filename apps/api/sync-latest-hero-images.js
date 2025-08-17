
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncLatestHeroImages() {
  console.log('🔍 Scanning object storage for latest hero images...');
  
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

    // Lazy-import the storage client
    const { Client } = await import('@replit/object-storage');
    const storage = new Client();

    // Get all objects from storage
    console.log('📂 Fetching objects from storage...');
    const listResult = await storage.list();
    
    if (!listResult.ok) {
      throw new Error(`Failed to list objects: ${listResult.error}`);
    }

    const objects = listResult.objects || [];
    console.log(`Found ${objects.length} objects in storage`);

    // Group objects by restaurant ID and find latest hero image for each
    const restaurantImages = {};

    for (const obj of objects) {
      // Object key format should be: restaurantId/heroImage-timestamp.ext
      const keyParts = obj.key.split('/');
      if (keyParts.length !== 2) continue;

      const [restaurantId, filename] = keyParts;
      
      // Check if this is a hero image
      if (!filename.startsWith('heroImage-')) continue;

      // Extract timestamp from filename (heroImage-YYYY-MM-DDTHH-mm-ss-sssZ.ext)
      const timestampMatch = filename.match(/heroImage-(.+)\.[^.]+$/);
      if (!timestampMatch) continue;

      const timestampStr = timestampMatch[1];
      let timestamp;
      
      try {
        // Parse the timestamp (replace hyphens with colons for time part)
        const dateStr = timestampStr.replace(/(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, '$1:$2:$3.$4Z');
        timestamp = new Date(dateStr);
      } catch (e) {
        console.warn(`Could not parse timestamp from ${filename}`);
        continue;
      }

      if (!restaurantImages[restaurantId] || timestamp > restaurantImages[restaurantId].timestamp) {
        restaurantImages[restaurantId] = {
          key: obj.key,
          timestamp: timestamp,
          filename: filename
        };
      }
    }

    console.log(`Found hero images for ${Object.keys(restaurantImages).length} restaurant(s)`);

    // Update each restaurant with their latest hero image URL
    let updateCount = 0;
    
    for (const restaurant of restaurants) {
      const latestImage = restaurantImages[restaurant.id];
      
      if (latestImage) {
        const newImageUrl = `/api/images/storage/${latestImage.key}`;
        
        console.log(`Updating ${restaurant.name}:`);
        console.log(`  Old: ${restaurant.heroImageUrl || 'None'}`);
        console.log(`  New: ${newImageUrl}`);
        console.log(`  File: ${latestImage.filename}`);
        console.log(`  Uploaded: ${latestImage.timestamp.toISOString()}`);
        
        await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: { heroImageUrl: newImageUrl }
        });
        
        updateCount++;
      } else {
        console.log(`No hero image found in storage for ${restaurant.name}`);
      }
    }

    console.log(`\n✅ Successfully updated ${updateCount} restaurant(s) with latest hero images`);
    
    // Show final summary
    console.log('\nFinal status:');
    const updatedRestaurants = await prisma.restaurant.findMany({
      select: {
        name: true,
        heroImageUrl: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    for (const restaurant of updatedRestaurants) {
      const status = restaurant.heroImageUrl ? '✅' : '❌';
      console.log(`${status} ${restaurant.name}: ${restaurant.heroImageUrl || 'No image'}`);
    }

  } catch (error) {
    console.error('❌ Error syncing hero images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncLatestHeroImages();
