/**
 * 后端通用工具函数
 */

/**
 * 计算两点间距离（使用 Haversine 公式）
 * @param {number} lat1 纬度1
 * @param {number} lon1 经度1 
 * @param {number} lat2 纬度2
 * @param {number} lon2 经度2
 * @returns {number} 距离（公里）
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // 地球半径(公里)
  const dLat = degreesToRadians(lat2 - lat1)
  const dLon = degreesToRadians(lon2 - lon1)
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * 角度转弧度
 * @param {number} degrees 角度
 * @returns {number} 弧度
 */
export const degreesToRadians = (degrees) => {
  return degrees * (Math.PI / 180)
}
