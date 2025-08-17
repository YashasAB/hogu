
const { Client } = require('@replit/object-storage');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStorageFolder() {
  console.log('🔍 Checking storage folders for all restaurants...');
  
  try {
    // Get all restaurants first
    const restaurants = await prisma.restaurant.findMany({
      select: {
        id: true,
        name: true
      }
    });

    console.log(`Found ${restaurants.length} restaurants to check\n`);

    const storage = new Client();
    
    // List all objects in storage
    const listResult = await storage.list();
    
    if (!listResult.ok) {
      throw new Error(`Failed to list objects: ${listResult.error}`);
    }

    const objects = listResult.objects || [];
    console.log(`📁 Total objects in storage: ${objects.length}\n`);
    
    // Check each restaurant's folder
    for (const restaurant of restaurants) {
      console.log(`\n📂 Checking folder for: ${restaurant.name} (ID: ${restaurant.id})`);
      
      // Filter objects that belong to this restaurant ID folder
      const restaurantObjects = objects.filter(obj => obj.key.startsWith(restaurant.id + '/'));
      
      console.log(`Found ${restaurantObjects.length} objects in folder '${restaurant.id}':`);
      
      if (restaurantObjects.length === 0) {
        console.log('  ❌ No objects found in this folder');
      } else {
        restaurantObjects.forEach((obj, index) => {
          console.log(`  ${index + 1}. ${obj.key}`);
          console.log(`     Size: ${obj.size} bytes`);
          console.log(`     Last Modified: ${obj.lastModified}`);
        });

        // Find hero images specifically
        const heroImages = restaurantObjects.filter(obj => {
          const filename = obj.key.split('/')[1]; // Get filename part
          return filename && filename.startsWith('heroImage-');
        });

        if (heroImages.length > 0) {
          console.log(`\n  🖼️  Found ${heroImages.length} hero image(s):`);
          
          // Sort by timestamp (newest first)
          const sortedImages = heroImages.sort((a, b) => {
            const timestampA = a.key.split('/')[1].match(/heroImage-(.+)\.[^.]+$/)?.[1] || '';
            const timestampB = b.key.split('/')[1].match(/heroImage-(.+)\.[^.]+$/)?.[1] || '';
            return timestampB.localeCompare(timestampA);
          });

          sortedImages.forEach((img, index) => {
            const filename = img.key.split('/')[1];
            const timestamp = filename.match(/heroImage-(.+)\.[^.]+$/)?.[1] || '';
            const isLatest = index === 0 ? ' ⭐ LATEST' : '';
            console.log(`     ${index + 1}. ${filename}${isLatest}`);
            console.log(`        Timestamp: ${timestamp}`);
            console.log(`        Full key: ${img.key}`);
          });

          const latestImage = sortedImages[0];
          const suggestedUrl = `/api/images/storage/${latestImage.key}`;
          console.log(`\n  💡 Suggested hero image URL: ${suggestedUrl}`);
        } else {
          console.log('  📷 No hero images found in this folder');
        }
      }
      
      console.log('  ' + '─'.repeat(50));
    }
    
    // Also show all unique folder names for reference
    const folderNames = new Set();
    objects.forEach(obj => {
      const parts = obj.key.split('/');
      if (parts.length > 1) {
        folderNames.add(parts[0]);
      }
    });
    
    console.log('\n📚 All folders in storage:');
    const sortedFolders = Array.from(folderNames).sort();
    sortedFolders.forEach(folder => {
      const restaurant = restaurants.find(r => r.id === folder);
      const restaurantName = restaurant ? ` (${restaurant.name})` : ' (unknown restaurant)';
      console.log(`  - ${folder}${restaurantName}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking storage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStorageFolder();
