import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ParkingService } from './parkingService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class ParkingInfoService {
  constructor() {
    this.parkingZones = new Map()
    this.parkingService = new ParkingService()
    this.loadParkingZones()
  }

  // 加载停车区域数据（从CSV文件）
  loadParkingZones() {
    try {
      // 从backend/src/services/ 到 backend/data/ 的正确路径
      const csvPath = path.join(__dirname, '../../data/parking_zones.csv')
      
      console.log('尝试加载CSV文件:', csvPath)
      
      if (fs.existsSync(csvPath)) {
        const csvData = fs.readFileSync(csvPath, 'utf8')
        this.parseCSVData(csvData)
      } else {
        console.log('CSV文件不存在，请确保文件路径正确')
        console.log('当前目录:', __dirname)
        console.log('尝试的路径:', csvPath)
        throw new Error('CSV文件不存在')
      }
    } catch (error) {
      console.error('加载停车区域数据失败:', error)
      throw error
    }
  }

  // 解析CSV数据
  parseCSVData(csvData) {
    const lines = csvData.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const values = line.split(',').map(v => v.trim())
      const zoneData = {}
      
      headers.forEach((header, index) => {
        zoneData[header] = values[index] || ''
      })
      
      // 使用ParkingZone列作为zone_id
      if (zoneData.ParkingZone) {
        // 确保ParkingZone是字符串类型
        const parkingZoneId = zoneData.ParkingZone.toString()
        this.parkingZones.set(parkingZoneId, {
          parking_zone_id: parkingZoneId,
          restriction_days: zoneData.Restriction_Days,
          time_restriction_start: zoneData.Time_Restrictions_Start,
          time_restriction_finish: zoneData.Time_Restrictions_Finish,
          restriction_display: zoneData.Restriction_Display
        })
      }
    }
    
    console.log(`加载了 ${this.parkingZones.size} 个停车区域`)
    // 显示前几个ParkingZone作为调试信息
    const sampleZones = Array.from(this.parkingZones.keys()).slice(0, 5)
    console.log('CSV中前5个ParkingZone:', sampleZones)
  }



  // 获取停车收费标准
  async getParkingRates() {
    return Array.from(this.parkingZones.values())
  }

  // 搜索停车位
  async searchParkingSpots({ location, radius = 300 }) {
    try {
      // 使用真实的墨尔本停车数据API
      const realSpots = await this.fetchRealTimeData(location, radius)
      
      // 将停车位数据与区域限制信息合并
      const enrichedSpots = realSpots.map(spot => {
        const zoneInfo = this.parkingZones.get(spot.parking_zone_id) || {}
        return {
          ...spot,
          restriction_display: zoneInfo.restriction_display || 'Unknown',
          restriction_days: zoneInfo.restriction_days || 'Daily',
          time_restriction_start: zoneInfo.time_restriction_start || '',
          time_restriction_finish: zoneInfo.time_restriction_finish || ''
        }
      })

      console.log(`返回 ${enrichedSpots.length} 个停车位`)
      return enrichedSpots
    } catch (error) {
      console.error('搜索停车位失败:', error)
      throw error
    }
  }

  // 获取真实停车数据
  async fetchRealTimeData(location, radius) {
    try {
      // 使用现有的ParkingService获取真实数据
      const result = await this.parkingService.getParkingSpots({}, 1000, 0)
      
      if (!result.spots || result.spots.length === 0) {
        throw new Error('没有获取到停车数据')
      }

      console.log(`获取到 ${result.spots.length} 个停车位`)
      console.log('CSV中的ParkingZone数量:', this.parkingZones.size)
      
      // 详细调试：显示前10个停车位的完整信息
      const sampleSpots = result.spots.slice(0, 10)
      console.log('=== 实时数据样本 ===')
      sampleSpots.forEach((spot, index) => {
        console.log(`${index + 1}. ${spot.street_name}: zone_number=${spot.zone_number} (类型: ${typeof spot.zone_number})`)
        // 显示所有可能的字段
        console.log(`   完整数据:`, {
          bay_id: spot.bay_id,
          sensor_id: spot.sensor_id,
          zone_number: spot.zone_number,
          street_name: spot.street_name,
          status: spot.status
        })
      })
      
      // 显示CSV中的前10个ParkingZone
      const csvZones = Array.from(this.parkingZones.keys()).slice(0, 10)
      console.log('=== CSV中的ParkingZone样本 ===')
      csvZones.forEach((zone, index) => {
        console.log(`${index + 1}. ${zone} (类型: ${typeof zone})`)
      })

      // 检查所有有zone_number的停车位
      const spotsWithZone = result.spots.filter(spot => spot.zone_number)
      console.log(`有zone_number的停车位数量: ${spotsWithZone.length}`)
      
      // 检查匹配情况
      let matchCount = 0
      const matchedSpots = []
      
      spotsWithZone.forEach(spot => {
        const zoneStr = spot.zone_number.toString()
        if (this.parkingZones.has(zoneStr)) {
          matchCount++
          matchedSpots.push(spot)
          console.log(`✅ 匹配成功: ${spot.street_name} (zone_number: ${spot.zone_number})`)
        } else {
          console.log(`❌ 不匹配: ${spot.street_name} (zone_number: ${spot.zone_number})`)
        }
      })
      
      console.log(`总匹配数: ${matchCount}/${spotsWithZone.length}`)

      // 如果找到匹配的停车位，返回它们
      if (matchedSpots.length > 0) {
        const spots = matchedSpots.slice(0, 20).map((spot, index) => ({
          id: spot.bay_id || spot.sensor_id || `spot_${index + 1}`,
          parking_zone_id: spot.zone_number.toString(),
          street_name: spot.street_name || 'Unknown Street',
          location: spot.street_name || 'Unknown Location',
          distance: Math.floor(Math.random() * radius) + 50,
          status: spot.status,
          latitude: spot.latitude,
          longitude: spot.longitude
        }))
        
        console.log(`返回 ${spots.length} 个匹配的停车位`)
        return spots
      } else {
        // 如果没有匹配，返回空数组
        console.log('没有找到匹配的停车位')
        return []
      }
    } catch (error) {
      console.error('获取真实停车数据失败:', error)
      throw error
    }
  }



  // 获取性价比推荐
  async getRecommendations({ location, limit = 5 }) {
    const spots = await this.searchParkingSpots({ location, radius: 300 })
    
    // 按优惠程度排序 (根据您的CSV文件中的限制类型)
    const restrictionOrder = {
      '4P': 1,      // 4小时停车 - 最优惠
      'MP4P': 2,    // 4小时停车
      '2P': 3,      // 2小时停车
      'MP2P': 4,    // 2小时停车
      'MP3P': 5,    // 3小时停车
      '1P': 6,      // 1小时停车
      'MP1P': 7,    // 1小时停车
      'LZ30': 8,    // 30分钟停车
      'QP': 9,      // 快速停车
      'SP': 10,     // 特殊停车
      'PP': 11      // 付费停车
    }
    
    spots.sort((a, b) => {
      const orderA = restrictionOrder[a.restriction_display] || 999
      const orderB = restrictionOrder[b.restriction_display] || 999
      
      if (orderA !== orderB) {
        return orderA - orderB
      }
      
      // 如果限制相同，按距离排序
      return a.distance - b.distance
    })
    
    return spots.slice(0, limit)
  }

  // 获取停车位详情
  async getSpotDetails(id) {
    const spots = await this.searchParkingSpots({ location: 'Melbourne', radius: 1000 })
    return spots.find(spot => spot.id == id)
  }

  // 计算停车费用（基于限制类型）
  async calculateCost({ zone_id, duration }) {
    const zone = this.parkingZones.get(zone_id)
    if (!zone) {
      throw new Error('停车区域不存在')
    }

    // 根据限制类型计算费用
    const restriction = zone.restriction_display
    let cost = 0

    switch (restriction) {
      case '1P':
        cost = duration * 2.50 // 1小时停车费
        break
      case '2P':
        cost = Math.min(duration * 2.00, 4.00) // 2小时停车费，最高4元
        break
      case '4P':
        cost = Math.min(duration * 1.50, 6.00) // 4小时停车费，最高6元
        break
      case 'MP2P':
        cost = Math.min(duration * 1.75, 3.50) // 2小时停车费，最高3.5元
        break
      default:
        cost = duration * 3.00 // 默认费率
    }

    return {
      zone_id,
      restriction_display: restriction,
      duration,
      cost: Math.round(cost * 100) / 100,
      currency: 'AUD'
    }
  }

  // 获取区域统计信息
  async getZoneStats() {
    const zones = Array.from(this.parkingZones.values())
    const stats = {
      total_zones: zones.length,
      restriction_types: {},
      average_hours: 0
    }

    zones.forEach(zone => {
      const restriction = zone.restriction_display
      stats.restriction_types[restriction] = (stats.restriction_types[restriction] || 0) + 1
    })

    return stats
  }

  // 重新加载CSV数据
  async reloadCSVData() {
    this.parkingZones.clear()
    this.loadParkingZones()
    return { success: true, message: '数据重新加载成功' }
  }

  // 获取调试信息
  async getDebugInfo() {
    try {
      // 获取实时数据样本
      const result = await this.parkingService.getParkingSpots({}, 50, 0)
      const sampleSpots = result.spots.slice(0, 10)
      
      // 获取CSV数据样本
      const csvZones = Array.from(this.parkingZones.keys()).slice(0, 10)
      
      // 检查匹配情况
      const matchedSpots = sampleSpots.filter(spot => 
        spot.zone_number && this.parkingZones.has(spot.zone_number.toString())
      )
      
      return {
        csv_loaded: this.parkingZones.size > 0,
        csv_sample: csvZones,
        real_data_count: result.spots.length,
        real_data_sample: sampleSpots.map(spot => ({
          street_name: spot.street_name,
          zone_number: spot.zone_number,
          zone_number_type: typeof spot.zone_number
        })),
        matched_count: matchedSpots.length,
        matched_sample: matchedSpots.map(spot => ({
          street_name: spot.street_name,
          zone_number: spot.zone_number,
          csv_info: this.parkingZones.get(spot.zone_number.toString())
        }))
      }
    } catch (error) {
      console.error('获取调试信息失败:', error)
      return {
        error: error.message,
        csv_loaded: this.parkingZones.size > 0,
        csv_sample: Array.from(this.parkingZones.keys()).slice(0, 5)
      }
    }
  }
}
