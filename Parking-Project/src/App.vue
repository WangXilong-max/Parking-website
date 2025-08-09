<script setup>
import ParkingMap from './components/ParkingMap.vue'
import DashboardView from './components/DashboardView.vue'
import { ref } from 'vue'

const showDashboard = ref(false)
</script>

<template>
  <div id="app" :class="{ 'dashboard-mode': showDashboard }">
    <nav class="top-nav">
      <button @click="showDashboard = !showDashboard" class="toggle-btn">
        {{ showDashboard ? 'View Map' : 'View Dashboard' }}
      </button>
    </nav>

    <Transition name="fade" mode="out-in">
      <ParkingMap v-if="!showDashboard" />
      <DashboardView v-else />
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
}

#app.dashboard-mode {
  overflow: auto;
  height: auto;
  min-height: 100vh;
}

.top-nav {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: auto;
}

.toggle-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.toggle-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
