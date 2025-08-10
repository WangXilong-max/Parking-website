/**
 * 通用工具函数
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
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * 获取停车位显示名称（统一格式）
 * @param {Object} spot 停车位数据
 * @returns {string} 显示名称
 */
export const getDisplayName = (spot) => {
  if (spot.street_name && spot.street_name !== 'Unknown Street') {
    return spot.street_name
  }
  // 使用ID生成Parking Lot名称
  const id = spot.id || spot.sensor_id || spot.bay_id || 'Unknown'
  return `Parking Lot ${id}`
}

/**
 * 格式化数字（添加千位分隔符）
 * @param {number} num 数字
 * @returns {string} 格式化后的字符串
 */
export const formatNumber = (num) => {
  if (!num) return '0'
  return new Intl.NumberFormat('en-AU').format(num)
}
