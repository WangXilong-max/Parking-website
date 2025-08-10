<script setup>
import ParkingMap from './components/ParkingMap.vue'
import DashboardView from './components/DashboardView.vue'
import HomePage from './components/HomePage.vue'
import { ref } from 'vue'
import backgroundImage from './images/background.jpg'

const currentPage = ref('home') // 'home', 'map', 'dashboard'

const navigateTo = (page) => {
  currentPage.value = page
}

const goHome = () => {
  currentPage.value = 'home'
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
          class="nav-btn"
          :class="{ active: currentPage === 'map' }"
        >
          Map
        </button>
        <button 
          @click="navigateTo('dashboard')" 
          class="nav-btn"
          :class="{ active: currentPage === 'dashboard' }"
        >
          Data
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
      />
      <DashboardView 
        v-else-if="currentPage === 'dashboard'" 
        :class="{ 'with-nav': currentPage !== 'home' }"
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
  height: 100vh;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

#app.with-nav {
  padding-top: 60px;
}

.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 9999;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.nav-actions {
  display: flex;
  gap: 10px;
}

.nav-btn {
  background: transparent;
  color: #333;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-btn:hover {
  background: rgba(0, 123, 255, 0.1);
  color: #007bff;
}

.nav-btn.active {
  background: #007bff;
  color: white;
}

.home-btn {
  background: #28a745;
  color: white;
}

.home-btn:hover {
  background: #218838;
  color: white;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 确保地图和仪表板组件在导航栏下方正确显示 */
.ParkingMap.with-nav,
.DashboardView.with-nav {
  height: calc(100vh - 60px);
  margin-top: 60px;
}
</style>
