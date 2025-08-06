<script setup>
import ParkingMap from './components/ParkingMap.vue'
</script>

<template>
  <div id="app">
    <ParkingMap />
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
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
