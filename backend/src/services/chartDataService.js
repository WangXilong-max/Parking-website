import pool from '../utils/db.js';

export class ChartDataService {
  
  // 获取人口数据 - 只取Melbourne Metro相关的数据
  async getPopulationData() {
    try {
      const query = `
        SELECT year, population_count, percentage_change
        FROM population 
        WHERE GCCSA_name ILIKE '%Melbourne%' OR GCCSA_name ILIKE '%Metro%'
        ORDER BY year ASC
      `;
      
      const { rows } = await pool.query(query);
      console.log(`📊 Retrieved ${rows.length} population records`);
      
      return rows.map(row => ({
        year: parseInt(row.year),
        population_count: parseInt(row.population_count),
        percentage_change: parseFloat(row.percentage_change) || 0
      }));
      
    } catch (error) {
      console.error('❌ Failed to get population data:', error);
      throw error;
    }
  }

  // 获取车辆数据 - 只取Melbourne Metro相关的数据  
  async getVehicleData() {
    try {
      const query = `
        SELECT year, no as count, percentage_change
        FROM vehicle 
        WHERE GCCSA_name ILIKE '%Melbourne%' OR GCCSA_name ILIKE '%Metro%'
        ORDER BY year ASC
      `;
      
      const { rows } = await pool.query(query);
      console.log(`🚗 Retrieved ${rows.length} vehicle records`);
      
      return rows.map(row => ({
        year: parseInt(row.year),
        count: parseInt(row.count),
        percentage_change: parseFloat(row.percentage_change) || 0
      }));
      
    } catch (error) {
      console.error('❌ Failed to get vehicle data:', error);
      throw error;
    }
  }

  // 获取所有图表数据
  async getAllChartData() {
    try {
      console.log('📈 Fetching all chart data from database...');
      
      const [populationData, vehicleData] = await Promise.all([
        this.getPopulationData(),
        this.getVehicleData()
      ]);

      // 计算车辆密度数据
      const densityData = this.calculateVehicleDensity(populationData, vehicleData);

      return {
        population: populationData,
        vehicle: vehicleData,
        density: densityData
      };
      
    } catch (error) {
      console.error('❌ Failed to get chart data:', error);
      throw error;
    }
  }

  // 计算车辆密度（每1000人的车辆数）
  calculateVehicleDensity(populationData, vehicleData) {
    const densityData = [];
    
    // 为每年计算密度
    for (const popRecord of populationData) {
      const vehicleRecord = vehicleData.find(v => v.year === popRecord.year);
      
      if (vehicleRecord && popRecord.population_count > 0) {
        const density = (vehicleRecord.count / popRecord.population_count) * 1000;
        densityData.push({
          year: popRecord.year,
          density: Math.round(density * 10) / 10 // 保留1位小数
        });
      }
    }
    
    console.log(`📊 Calculated ${densityData.length} density records`);
    return densityData;
  }
}

export default new ChartDataService();
