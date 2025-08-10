<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2>Melbourne Insights Dashboard</h2>
    </div>

    <div class="stats-grid">
      <!-- Population Stats -->
      <div class="stat-card">
        <h3>Current Population (2021)</h3>
        <div class="stat-value">{{ formatNumber(populationData[populationData.length - 1]?.population_count) }}</div>
        <div class="stat-change" :class="getChangeClass(getPopulationGrowth())">
          {{ getPopulationGrowth() }}% from 2020
        </div>
      </div>

      <!-- Vehicle Stats -->
      <div class="stat-card">
        <h3>Registered Vehicles (2021)</h3>
        <div class="stat-value">{{ formatNumber(vehicleData[vehicleData.length - 1]?.count) }}</div>
        <div class="stat-change" :class="getChangeClass(getVehicleGrowth())">
          {{ getVehicleGrowth() }}% from 2020
        </div>
      </div>

      <!-- Vehicles per Capita -->
      <div class="stat-card">
        <h3>Vehicles per Capita (2021)</h3>
        <div class="stat-value">{{ getVehiclesPerCapita() }}</div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-vertical">
      <!-- Population Trend Chart -->
      <div class="chart-card">
        <h3>Population Growth Trend (2015-2021)</h3>
        <LineChart
          :data="populationChartData"
          :options="chartOptions"
        />
      </div>

      <!-- Vehicle Registration Trend Chart -->
      <div class="chart-card">
        <h3>Vehicle Registration Trend (2017-2021)</h3>
        <LineChart
          :data="vehicleChartData"
          :options="chartOptions"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line as LineChart } from 'vue-chartjs'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

// Population and Vehicle Data
const populationData = ref([
  { year: 2015, population_count: 4586012, percentage_change: 2.457 },
  { year: 2016, population_count: 4714387, percentage_change: 2.799 },
  { year: 2017, population_count: 4818100, percentage_change: 2.200 },
  { year: 2018, population_count: 4913138, percentage_change: 1.973 },
  { year: 2019, population_count: 5001917, percentage_change: 1.807 },
  { year: 2020, population_count: 5054839, percentage_change: 1.058 },
  { year: 2021, population_count: 4976157, percentage_change: -1.557 }
])

const vehicleData = ref([
  { year: 2017, count: 209495, percentage_change: 4.2 },
  { year: 2018, count: 214408, percentage_change: 4.2 },
  { year: 2019, count: 236429, percentage_change: 4.5 },
  { year: 2020, count: 215728, percentage_change: 4.0 },
  { year: 2021, count: 188855, percentage_change: 3.5 }
])

// Chart Configuration
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top'
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      ticks: {
        callback: function(value) {
          return formatNumber(value)
        }
      }
    }
  }
}

// Computed Properties
const populationChartData = computed(() => ({
  labels: populationData.value.map(d => d.year),
  datasets: [
    {
      label: 'Population',
      data: populationData.value.map(d => d.population_count),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }
  ]
}))

const vehicleChartData = computed(() => ({
  labels: vehicleData.value.map(d => d.year),
  datasets: [
    {
      label: 'Registered Vehicles',
      data: vehicleData.value.map(d => d.count),
      borderColor: 'rgb(255, 99, 132)',
      tension: 0.1
    }
  ]
}))

// Helper Methods
const formatNumber = (num) => {
  if (!num) return '0'
  return new Intl.NumberFormat('en-AU').format(num)
}

const getChangeClass = (change) => {
  return {
    'positive': change > 0,
    'negative': change < 0,
    'neutral': change === 0
  }
}

const getPopulationGrowth = () => {
  const data = populationData.value
  if (data.length < 2) return 0
  return data[data.length - 1].percentage_change.toFixed(1)
}

const getVehicleGrowth = () => {
  const data = vehicleData.value
  if (data.length < 2) return 0
  return data[data.length - 1].percentage_change.toFixed(1)
}

const getVehiclesPerCapita = () => {
  const latestYear = 2021
  const population = populationData.value.find(d => d.year === latestYear)?.population_count
  const vehicles = vehicleData.value.find(d => d.year === latestYear)?.count

  if (!population || !vehicles) return '0'
  return (vehicles / population).toFixed(3)
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}

.dashboard-header {
  margin-bottom: 30px;
}

.dashboard-header h2 {
  color: #2c3e50;
  font-size: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-card h3 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 0.9em;
}

.stat-value {
  font-size: 1.8em;
  font-weight: bold;
  color: #2c3e50;
}

.charts-vertical {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0;
}

.chart-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  height: 400px;
}

.chart-card h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.stat-change {
  font-size: 0.9em;
  margin-top: 5px;
  padding: 4px 8px;
  border-radius: 12px;
  display: inline-block;
}

.stat-change.positive {
  background: #e3fcef;
  color: #0a7c42;
}

.stat-change.negative {
  background: #fee2e2;
  color: #dc2626;
}

.stat-change.neutral {
  background: #f3f4f6;
  color: #4b5563;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .chart-card {
    height: 300px;
  }
}
</style>
