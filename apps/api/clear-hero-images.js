
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearHeroImageUrls() {
  console.log('🗑️  Starting to clear all hero image URLs from database...');
  
  try {
    // Get count of restaurants with hero images
    const count = await prisma.restaurant.count({
      where: {
        heroImageUrl: {
          not: null
        }
      }
    });
    
    console.log(`📂 Found ${count} restaurants with hero image URLs`);
    
    if (count === 0) {
      console.log('✅ No hero image URLs to clear');
      return;
    }
    
    // Clear all hero image URLs
    const result = await prisma.restaurant.updateMany({
      where: {
        heroImageUrl: {
          not: null
        }
      },
      data: {
        heroImageUrl: null
      }
    });
    
    console.log(`✅ Successfully cleared ${result.count} hero image URLs`);
    console.log('🎉 Database cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
clearHeroImageUrls();
