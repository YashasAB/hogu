
const { Client } = require("@replit/object-storage");
const { PrismaClient } = require('@prisma/client');

const storage = new Client();
const prisma = new PrismaClient();

async function forceCleanup() {
  console.log('🔥 Starting FORCE cleanup...');
  
  try {
    // Clear database hero image URLs first
    console.log('📋 Clearing database hero image URLs...');
    const result = await prisma.restaurant.updateMany({
      data: {
        heroImageUrl: null
      }
    });
    console.log(`✅ Cleared ${result.count} hero image URLs from database`);
    
    // List and delete all objects from storage
    console.log('📋 Listing all objects in storage...');
    const { ok, value, error } = await storage.list();
    
    if (!ok) {
      console.error('❌ Failed to list objects:', error);
      return;
    }
    
    if (!value || value.length === 0) {
      console.log('✅ Storage is already empty');
      return;
    }
    
    console.log(`📂 Found ${value.length} objects to delete`);
    
    // Delete all objects
    for (const item of value) {
      try {
        console.log(`🗑️  Deleting: ${item.key}`);
        const deleteResult = await storage.delete(item.key);
        
        if (deleteResult.ok) {
          console.log(`✅ Deleted: ${item.key}`);
        } else {
          console.error(`❌ Failed to delete ${item.key}:`, deleteResult.error);
          
          // Try alternative deletion method
          console.log(`🔄 Retrying deletion of: ${item.key}`);
          const retryResult = await storage.delete(item.key);
          if (retryResult.ok) {
            console.log(`✅ Retry successful: ${item.key}`);
          }
        }
      } catch (err) {
        console.error(`❌ Error deleting ${item.key}:`, err);
      }
    }
    
    // Verify cleanup
    console.log('🔍 Verifying cleanup...');
    const verifyResult = await storage.list();
    if (verifyResult.ok && verifyResult.value) {
      console.log(`📊 Objects remaining: ${verifyResult.value.length}`);
      if (verifyResult.value.length > 0) {
        console.log('⚠️  Some objects may still remain:');
        verifyResult.value.forEach(item => console.log(`   - ${item.key}`));
      } else {
        console.log('🎉 Storage is now completely empty!');
      }
    }
    
  } catch (error) {
    console.error('❌ Force cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceCleanup();
