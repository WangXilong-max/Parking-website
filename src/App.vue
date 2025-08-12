<script setup>
import ParkingMap from './components/ParkingMap.vue'
import DashboardView from './components/DashboardView.vue'
import HomePage from './components/HomePage.vue'
import ParkingInfo from './components/ParkingInfo.vue'
import { ref } from 'vue'
import backgroundImage from './images/background.jpg'

const currentPage = ref('home') // 'home', 'map', 'dashboard', 'parking-info'
const selectedSpot = ref(null) // 存储选中的停车位信息

const navigateTo = (page) => {
  console.log('App.vue: navigateTo called with page:', page, 'current selectedSpot:', selectedSpot.value)
  currentPage.value = page
  // 只有在跳转到home时才清空selectedSpot
  if (page === 'home') {
    selectedSpot.value = null
  }
}

const goHome = () => {
  currentPage.value = 'home'
  selectedSpot.value = null
}

const handleShowSpotOnMap = (spotInfo) => {
  console.log('App.vue: handleShowSpotOnMap called with:', spotInfo)
  selectedSpot.value = spotInfo
  console.log('App.vue: selectedSpot set to:', selectedSpot.value)
}
</script>

<template>
  <div id="app" :style="{ backgroundImage: `url(${backgroundImage})` }">
    <!-- 导航栏 -->
    <nav class="top-nav" v-if="currentPage !== 'home'">
      <button @click="goHome" class="nav-btn home-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
        </svg>
        Home
      </button>
      
      <div class="nav-actions">
        <button 
          @click="navigateTo('map')" 
          class="nav-btn modern-btn"
          :class="{ active: currentPage === 'map' }"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
          </svg>
          Map
        </button>
        <button 
          @click="navigateTo('dashboard')" 
          class="nav-btn modern-btn"
          :class="{ active: currentPage === 'dashboard' }"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.5h-15V5h15v14.5z" stroke="currentColor" stroke-width="1.5" fill="none"/>
          </svg>
          Data Insights
        </button>
        <button 
          @click="navigateTo('parking-info')" 
          class="nav-btn modern-btn"
          :class="{ active: currentPage === 'parking-info' }"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.5" fill="none"/>
          </svg>
          Plan Ahead
        </button>
      </div>
    </nav>

    <!-- 页面内容 -->
    <Transition name="fade" mode="out-in">
      <HomePage 
        v-if="currentPage === 'home'" 
        @navigate="navigateTo"
      />
      <ParkingMap 
        v-else-if="currentPage === 'map'" 
        :class="{ 'with-nav': currentPage !== 'home' }"
        :selectedSpot="selectedSpot"
      />
      <DashboardView 
        v-else-if="currentPage === 'dashboard'" 
        :class="{ 'with-nav': currentPage !== 'home' }"
      />
      <ParkingInfo 
        v-else-if="currentPage === 'parking-info'" 
        :class="{ 'with-nav': currentPage !== 'home' }"
        @navigate="navigateTo"
        @showSpotOnMap="handleShowSpotOnMap"
      />
    </Transition>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  background: #f5f5f5;
}

#app {
  width: 100%;
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

/* 移除未使用的CSS类 */

.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 65px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 9999;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.nav-actions {
  display: flex;
  gap: 12px;
}

.nav-btn {
  background: transparent;
  color: #4a5568;
  border: 1px solid rgba(226, 232, 240, 0.8);
  padding: 10px 18px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.modern-btn {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(203, 213, 225, 0.6);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.nav-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
  background: linear-gradient(135deg, rgba(239, 246, 255, 0.95) 0%, rgba(219, 234, 254, 0.95) 100%);
  color: #2563eb;
}

.nav-btn.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-color: #2563eb;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}

.nav-btn.active:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.home-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-color: #059669;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.2);
}

.home-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
  color: white;
  border-color: #047857;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 确保地图组件在导航栏下方正确显示 */
.ParkingMap.with-nav {
  height: calc(100vh - 65px);
  margin-top: 65px;
}
</style>
