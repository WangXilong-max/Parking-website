import cron from 'node-cron';
import { ParkingService } from './parkingService.js';

const parkingService = new ParkingService();

// 启动数据同步服务
export function startParkingDataSync() {
  console.log('⏰ 启动停车数据定时同步服务...');
  
  // 每5分钟同步一次数据
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log(`🔄 [${new Date().toISOString()}] 开始定时同步停车数据...`);
      const result = await parkingService.forceRefreshData();
      console.log(`✅ [${new Date().toISOString()}] 定时同步完成，更新 ${result.updated} 条记录`);
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] 定时同步失败:`, error.message);
    }
  });
  
  // 启动时立即执行一次数据同步
  setTimeout(async () => {
    try {
      console.log('🚀 启动时首次同步停车数据...');
      const result = await parkingService.forceRefreshData();
      console.log(`✅ 首次同步完成，获取到 ${result.updated} 条停车数据`);
    } catch (error) {
      console.error('❌ 首次同步失败:', error.message);
    }
  }, 2000); // 2秒后执行，给服务器启动时间
  
  console.log('✅ 定时同步服务已启动 (每5分钟执行一次)');
}
