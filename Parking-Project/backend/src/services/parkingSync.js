import cron from 'node-cron';
import { ParkingService } from './parkingService.js';

const parkingService = new ParkingService();

// Start data synchronization service
export function startParkingDataSync() {
  console.log('⏰ Starting parking data scheduled sync service...');
  
  // Sync data every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log(`🔄 [${new Date().toISOString()}] Starting scheduled parking data sync...`);
      const result = await parkingService.forceRefreshData();
      console.log(`✅ [${new Date().toISOString()}] Scheduled sync completed, updated ${result.updated} records`);
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] Scheduled sync failed:`, error.message);
    }
  });
  
  // Execute data sync immediately on startup
  setTimeout(async () => {
    try {
      console.log('🚀 Initial sync of parking data on startup...');
      const result = await parkingService.forceRefreshData();
      console.log(`✅ Initial sync completed, retrieved ${result.updated} parking data records`);
    } catch (error) {
      console.error('❌ Initial sync failed:', error.message);
    }
  }, 2000); // Execute after 2 seconds, give server time to start
  
  console.log('✅ Scheduled sync service started (executes every 5 minutes)');
}
