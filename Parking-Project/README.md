# Melbourne Parking Map

一个显示墨尔本停车位信息的交互式地图应用。

## 功能特性

- 🗺️ 基于MapBox的交互式地图
- 🔍 地址搜索和位置定位
- 🅿️ 实时停车位数据显示
- 📍 300米范围内停车位过滤
- 🎯 搜索位置标记和超级放大
- 📱 移动端响应式设计

## 快速开始

### 前端启动
```bash
npm install
npm run dev
```

### 后端启动
```bash
cd backend
npm install
npm start
```

### 同时启动前后端
```bash
# Windows
start-dev.bat

# PowerShell
.\start-dev.ps1
```

## 配置

在根目录创建 `.env` 文件：
```
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
VITE_BACKEND_URL=http://localhost:3001
```

## 技术栈

- **前端**: Vue 3 + Vite + MapBox GL JS
- **后端**: Node.js + Express
- **数据源**: 墨尔本政府开放数据API