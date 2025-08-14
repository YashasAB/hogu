
const { Client } = require("@replit/object-storage");

async function clearAllImages() {
  console.log('🗑️  Starting to clear all images from object storage...');
  
  try {
    const storage = new Client();
    
    // List all objects in the bucket
    console.log('📋 Listing all objects...');
    const { ok, value, error } = await storage.list();
    
    if (!ok) {
      console.error('❌ Failed to list objects:', error);
      return;
    }
    
    if (!value || value.length === 0) {
      console.log('✅ No objects found in storage');
      return;
    }
    
    console.log(`📂 Found ${value.length} objects to delete`);
    
    // Delete each object
    let deleteCount = 0;
    let errorCount = 0;
    
    for (const item of value) {
      try {
        console.log(`🗑️  Deleting: ${item.key}`);
        const deleteResult = await storage.delete(item.key);
        
        if (deleteResult.ok) {
          deleteCount++;
          console.log(`✅ Deleted: ${item.key}`);
        } else {
          errorCount++;
          console.error(`❌ Failed to delete ${item.key}:`, deleteResult.error);
        }
      } catch (err) {
        errorCount++;
        console.error(`❌ Error deleting ${item.key}:`, err);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully deleted: ${deleteCount} objects`);
    console.log(`❌ Failed to delete: ${errorCount} objects`);
    console.log('🎉 Object storage cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
clearAllImages();
