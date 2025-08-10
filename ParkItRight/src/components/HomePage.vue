<template>
  <div class="home-page">
    <header class="hero-section">
      <h1 class="hero-title">ParkItRight</h1>
      <p class="hero-subtitle">Smart Parking Solutions</p>
    </header>

    <main class="main-content">
      <div class="features-grid">
        <!-- Find Parking 区块 -->
        <div class="feature-card" @click="navigateToMap">
          <div class="feature-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
            </svg>
          </div>
          <h3 class="feature-title">Find Parking</h3>
          <p class="feature-description">Find nearby parking spots with real-time availability</p>
          <div class="feature-action">
            <span class="action-text">Start Finding</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
            </svg>
          </div>
        </div>

        <!-- Data Insights 区块 -->
        <div class="feature-card" @click="navigateToDashboard">
          <div class="feature-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" fill="currentColor"/>
            </svg>
          </div>
          <h3 class="feature-title">Data Insights</h3>
          <p class="feature-description">View parking data analytics and usage trends</p>
          <div class="feature-action">
            <span class="action-text">View Data</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
            </svg>
          </div>
        </div>

        <!-- 预留区块 -->
        <div class="feature-card coming-soon">
          <div class="feature-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
          </div>
          <h3 class="feature-title">Coming Soon</h3>
          <p class="feature-description">More features are under development, stay tuned</p>
          <div class="feature-action">
            <span class="action-text">Coming Soon</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
const emit = defineEmits(['navigate'])

const navigateToMap = () => {
  emit('navigate', 'map')
}

const navigateToDashboard = () => {
  emit('navigate', 'dashboard')
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  color: white;
  font-family: 'Arial', sans-serif;
  position: relative;
  overflow: hidden;
}

/* 更新卡片样式以配合新背景 */
.feature-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.feature-card:hover::before {
  left: 100%;
}

.feature-card:hover {
  transform: translateY(-10px);
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.feature-card.coming-soon {
  opacity: 0.7;
  cursor: not-allowed;
}

.feature-card.coming-soon:hover {
  transform: none;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

.feature-icon {
  margin-bottom: 24px;
  color: #fff;
}

/* 更新标题样式 */
.hero-section {
  text-align: center;
  padding: 80px 20px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: bold;
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 40px;
}

.main-content {
  padding: 0 20px 60px;
  max-width: 1200px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 16px;
  color: #fff;
}

.feature-description {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 24px;
  opacity: 0.9;
  color: #fff;
}

.feature-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  color: #fff;
}

.action-text {
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .feature-card {
    padding: 30px 20px;
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 60px 20px 40px;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .main-content {
    padding: 0 15px 40px;
  }
}
</style>
