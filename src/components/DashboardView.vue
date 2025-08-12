<template>
  <div class="mm-dashboard">
    <!-- Title Row -->
    <div class="mm-header">
      <div>
        <h1>Melbourne Metro Insights Dashboard</h1>
        <p class="subtitle">Analysis of population and vehicle trends across Metropolitan Melbourne (2017–2021)</p>
      </div>
      <span class="updated">Updated 2021</span>
    </div>

    <!-- Executive Summary -->
    <section class="panel summary">
      <div class="summary-metrics">
        <div class="metric">
          <div class="metric-value positive">+3.3%</div>
          <div class="metric-label">Net Population Growth</div>
        </div>
        <div class="metric">
          <div class="metric-value negative">-9.9%</div>
          <div class="metric-label">Vehicle Change</div>
        </div>
        <div class="metric">
          <div class="metric-value negative">-12.6%</div>
          <div class="metric-label">Vehicle Density Change</div>
        </div>
      </div>
      <p class="summary-text">
        Melbourne Metro experienced significant demographic and mobility shifts during 2017–2021. While population grew steadily until 2020, vehicle registrations peaked in 2019 before declining substantially through 2021. This trend suggests changing urban mobility patterns, likely influenced by pandemic impacts, remote work adoption, and evolving transportation preferences.
      </p>
    </section>

    <!-- KPI Cards -->
    <section class="kpis">
      <div class="kpi-card">
        <div class="kpi-title">Population Growth</div>
        <div class="kpi-row"><span class="kpi-number positive">+3.3%</span><span>2017–2021</span></div>
        <div class="kpi-sub">{{ fmt(4818100) }} → {{ fmt(4976157) }}</div>
        <div class="kpi-foot">Peak: {{ fmt(5054839) }} in 2020</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-title">Vehicle Registrations</div>
        <div class="kpi-row"><span class="kpi-number negative">-9.9%</span><span>2017–2021</span></div>
        <div class="kpi-sub">209k → 189k</div>
        <div class="kpi-foot">Peak: 236k in 2019</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-title">Vehicle Density</div>
        <div class="kpi-row"><span class="kpi-number negative">-12.6%</span><span>2017–2021</span></div>
        <div class="kpi-sub">43.5 → 38 per 1,000</div>
        <div class="kpi-foot">Peak: 47.3 per 1,000 in 2019</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-title">Peak Decline</div>
        <div class="kpi-row"><span class="kpi-number negative">-20.1%</span><span>From 2019 peak</span></div>
        <div class="kpi-sub">–48k vehicles</div>
        <div class="kpi-foot">Largest decline: 2019–2021</div>
      </div>
    </section>

    <!-- Population vs Vehicle Registration Trends -->
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Population vs Vehicle Registration Trends</div>
        <div class="panel-range">2017–2021</div>
      </div>

      <div class="obs">
        <div class="obs-title">Key observations:</div>
        <ul>
          <li><span class="blue-dot"/> Blue line: Melbourne Metro population (millions)</li>
          <li><span class="red-dot"/> Red line: Vehicle registrations (thousands)</li>
          <li>Population peaked in 2020 at 5.05M, then declined to 4.98M in 2021</li>
          <li>Vehicle registrations peaked earlier in 2019 at 236k, then fell sharply to 189k by 2021</li>
          <li>Divergence suggests changing mobility patterns and urban planning impacts</li>
        </ul>
      </div>

      <div class="chart-wrap">
        <LineChart :data="popVehChartData" :options="lineOptions" />
      </div>

      <div class="callouts">
        <div class="callout info">
          <div class="callout-title">Population Trends</div>
          <p>Consistent growth through 2020, followed by COVID-19 related decline. Shows urban resilience with gradual recovery expected.</p>
        </div>
        <div class="callout warn">
          <div class="callout-title">Vehicle Registration Patterns</div>
          <p>Sharp peak in 2019 followed by significant decline, suggesting shifts toward alternative transportation and remote work adoption.</p>
        </div>
      </div>
    </section>

    <!-- Vehicle Ownership Density Evolution -->
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Vehicle Ownership Density Evolution</div>
        <div class="panel-tag">Density Analysis</div>
      </div>
      <p class="panel-desc">Vehicle registrations per 1,000 residents shows the changing relationship between population and car ownership.</p>

      <div class="obs">
        <div class="obs-title">Understanding the density trend:</div>
        <ul>
          <li>Peak density reached 47.3 vehicles per 1,000 people in 2019</li>
          <li>Sharp decline to 38.0 per 1,000 by 2021 represents significant behavioral shift</li>
          <li>Melbourne's ratios are relatively low compared to suburban areas (typically 600–800 per 1,000)</li>
          <li>Declining trend suggests successful integration of alternative transport alternatives and lifestyle changes</li>
        </ul>
      </div>

      <div class="chart-wrap">
        <BarChart :data="densityChartData" :options="barOptions" />
      </div>

      <div class="density-pills">
        <span class="pill">43.5<br><small>2017 Starting Point</small></span>
        <span class="pill">47.3<br><small>2019 Peak</small></span>
        <span class="pill">38<br><small>2021 Current</small></span>
      </div>
    </section>

    <!-- Transportation & Parking Implications -->
    <section class="panel">
      <div class="panel-title">Transportation & Parking Implications</div>
      <div class="two-col">
        <div>
          <h4>Key Trend Analysis</h4>
          <ul class="dot-list">
            <li class="dot red"><strong>Peak Vehicle Ownership (2019)</strong><br/>236,429 registered vehicles marked the highest point before subsequent decline, indicating a shift in urban mobility preferences</li>
            <li class="dot blue"><strong>Pandemic Impact (2020–2021)</strong><br/>Combined population decrease (~1.6%) and vehicle registration decline (~20%) reflects remote work adoption and changing urban living patterns</li>
            <li class="dot green"><strong>Declining Vehicle Density</strong><br/>From 47.3 to 38.0 vehicles per 1,000 people suggests successful integration of alternative transport options and urban planning initiatives</li>
          </ul>
        </div>
        <div>
          <h4>Parking Infrastructure Implications</h4>
          <ul class="dot-list">
            <li class="dot purple"><strong>Reduced Parking Pressure</strong><br/>20% decline in vehicle registrations since 2019 reduces competition for parking spaces, particularly in CBD areas</li>
            <li class="dot orange"><strong>Opportunity for Repurposing</strong><br/>Lower vehicle density creates opportunities to repurpose parking infrastructure for green spaces, bike lanes, and mixed-use development</li>
            <li class="dot teal"><strong>Smart Parking Evolution</strong><br/>Technology solutions become more important for optimizing remaining parking demand and supporting multi-modal transport integration</li>
          </ul>
        </div>
      </div>

      <div class="opps">
        <h4>Strategic Opportunities for Melbourne</h4>
        <p>The significant decline in vehicle ownership presents Melbourne with a unique opportunity to reimagine urban mobility. With vehicle density dropping to 38 per 1,000 residents—well below typical urban levels—the city can focus on optimizing existing parking infrastructure while investing in sustainable transport alternatives. This trend supports the transition toward a more liveable, environmentally sustainable urban environment.</p>
        <div class="two-col">
          <div>
            <h5>Immediate Opportunities:</h5>
            <ul>
              <li>Optimize existing parking supply with smart technology</li>
              <li>Convert underutilized parking areas to green infrastructure</li>
              <li>Enhance bike-share and e-scooter integration</li>
            </ul>
          </div>
          <div>
            <h5>Long-term Vision:</h5>
            <ul>
              <li>Car-free zones with enhanced public transport</li>
              <li>Integrated mobility hubs combining transport modes</li>
              <li>Adaptive parking structures for changing urban needs</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Important Data Notice -->
    <section class="panel notice">
      <div class="notice-head">
        <div class="icon">i</div>
        <div>
          <div class="panel-title">Important Data Notice</div>
          <div class="muted">Data Currency and Post-Pandemic Recovery</div>
        </div>
      </div>
      <p><strong>Please note:</strong> This analysis is based on data through 2021, representing the immediate pandemic period. As Melbourne and its residents continue to recover from COVID-19 impacts, significant changes in population growth, vehicle ownership patterns, and urban mobility behaviors may have occurred since this data was collected.</p>
      <h5>Expected Recovery Trends:</h5>
      <ul>
        <li>Population recovery as international borders reopened and migration resumed</li>
        <li>Potential increase in vehicle registrations as people return to offices and normal activities</li>
        <li>Evolution of hybrid work patterns affecting commuting and parking demand</li>
        <li>Continued growth in alternative transportation adoption (e-bikes, scooters, car-sharing)</li>
        <li>Infrastructure investments in public transport and active mobility options</li>
      </ul>
      <p class="muted small">For the most current insights and planning decisions, consider supplementing this historical analysis with recent data from the Australian Bureau of Statistics, VicRoads, and Melbourne city planning authorities.</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line as LineChart, Bar as BarChart } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

// ---- 数据从数据库获取 ----
const populationData = ref([])
const vehicleData = ref([])
const densityData = ref([])
const loading = ref(true)
const error = ref(null)

// 从API获取图表数据
const loadChartData = async () => {
  try {
    loading.value = true
    console.log('📊 Loading chart data from database...')
    
    const response = await fetch('/api/chart-data')
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to load chart data')
    }
    
    if (result.success && result.data) {
      populationData.value = result.data.population || []
      vehicleData.value = result.data.vehicle || []
      densityData.value = result.data.density || []
      
      console.log('✅ Chart data loaded successfully:', {
        population: populationData.value.length,
        vehicle: vehicleData.value.length,
        density: densityData.value.length
      })
    } else {
      throw new Error(result.error || 'No data received')
    }
    
  } catch (err) {
    console.error('❌ Failed to load chart data:', err)
    error.value = err.message
    
    // 如果API失败，使用备用的硬编码数据
    console.log('📦 Using fallback static data...')
    populationData.value = [
      { year: 2017, population_count: 4818100 },
      { year: 2018, population_count: 4913138 },
      { year: 2019, population_count: 5001917 },
      { year: 2020, population_count: 5054839 },
      { year: 2021, population_count: 4976157 }
    ]
    vehicleData.value = [
      { year: 2017, count: 209495 },
      { year: 2018, count: 214408 },
      { year: 2019, count: 236429 },
      { year: 2020, count: 215728 },
      { year: 2021, count: 188855 }
    ]
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
onMounted(loadChartData)

// Helper to format thousands with commas
const fmt = (n) => new Intl.NumberFormat('en-AU').format(n)

// ---- Charts ----
const popVehChartData = computed(() => ({
  labels: populationData.value.map(d => d.year),
  datasets: [
    {
      label: 'Population',
      data: populationData.value.map(d => d.population_count / 1_000_000), // millions
      borderColor: '#3b82f6',
      backgroundColor: 'transparent',
      tension: 0.25,
      yAxisID: 'y1'
    },
    {
      label: 'Vehicles',
      data: vehicleData.value.map(d => d.count / 1_000), // thousands
      borderColor: '#ef4444',
      backgroundColor: 'transparent',
      tension: 0.25,
      yAxisID: 'y2'
    }
  ]
}))

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } },
  scales: {
    y1: {
      type: 'linear',
      position: 'left',
      title: { display: true, text: 'Population (millions)' },
      grid: { drawOnChartArea: true }
    },
    y2: {
      type: 'linear',
      position: 'right',
      title: { display: true, text: 'Vehicles (thousands)' },
      grid: { drawOnChartArea: false }
    }
  }
}

const densityChartData = computed(() => {
  // 如果密度数据可用，使用API数据；否则使用备用数据
  const densityValues = densityData.value.length > 0 
    ? densityData.value.map(d => d.density)
    : [43.5, 43.2, 47.3, 41.0, 38.0] // 备用数据
    
  const densityYears = densityData.value.length > 0
    ? densityData.value.map(d => d.year)
    : [2017, 2018, 2019, 2020, 2021] // 备用数据

  return {
    labels: densityYears,
    datasets: [
      {
        label: 'Vehicles per 1,000 people',
        data: densityValues,
        backgroundColor: densityValues.map((_, index) => 
          // 2019年（通常是第3个索引）使用深绿色
          densityYears[index] === 2019 ? '#059669' : '#10b981'
        ),
        borderColor: '#059669',
        borderWidth: 1
      }
    ]
  }
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: function(context) {
          return `${context.parsed.y} vehicles per 1,000 people`
        }
      }
    }
  },
  scales: {
    y: { 
      beginAtZero: false,
      min: 35,
      max: 50,
      title: {
        display: true,
        text: 'Vehicles per 1,000 people'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Year'
      }
    }
  }
}
</script>

<style scoped>
.mm-dashboard{max-width:1200px;margin:0 auto;padding:40px 24px 40px 24px;background:#fafafa;color:#1f2937;margin-top:65px;box-sizing:border-box}
.mm-header{display:grid;grid-template-columns:1fr auto;align-items:center;gap:16px;margin-bottom:24px}

.mm-header h1{margin:0;font-size:22px}
.subtitle{margin:4px 0 0;color:#6b7280}
.updated{font-size:12px;color:#6b7280;border:1px solid #e5e7eb;border-radius:8px;padding:6px 10px}

.panel{background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.04);padding:24px;margin-bottom:20px}
.summary{background:linear-gradient(135deg,#ffffff, #fff9f2)}
.summary-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px}
.metric{padding:12px 8px;text-align:center;background:#fafbfc;border-radius:8px}
.metric-value{font-size:24px;font-weight:700;margin-bottom:6px}
.metric-value.positive{color:#059669}
.metric-value.negative{color:#dc2626}
.metric-label{font-size:13px;color:#6b7280;line-height:1.4}
.summary-text{color:#374151;margin:0;font-size:15px;line-height:1.6}

.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin:12px 0 24px}
.kpi-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:18px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.kpi-title{font-size:15px;color:#6b7280;margin-bottom:10px;font-weight:500}
.kpi-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.kpi-number{font-weight:700;font-size:20px}
.kpi-number.positive{color:#059669}
.kpi-number.negative{color:#dc2626}
.kpi-sub{color:#111827;font-weight:600;font-size:14px;margin-bottom:6px}
.kpi-foot{font-size:12px;color:#9ca3af;line-height:1.4}

.panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.panel-title{font-weight:700;font-size:18px;margin-bottom:16px}
.panel-range,.panel-tag{font-size:12px;color:#6b7280;border:1px solid #e5e7eb;border-radius:8px;padding:4px 8px}
.panel-desc{margin-top:8px;color:#6b7280;font-size:15px;line-height:1.6}

.obs{background:#fbfbfc;border:1px solid #eef0f3;border-radius:12px;padding:16px;margin:12px 0 20px}
.obs-title{font-weight:700;margin-bottom:10px;font-size:15px}
.obs ul{margin:0 0 0 20px;padding:0}
.obs li{margin-bottom:6px;line-height:1.5;font-size:14px}
.blue-dot::before{content:"";display:inline-block;width:8px;height:8px;background:#3b82f6;border-radius:50%;margin-right:8px}
.red-dot::before{content:"";display:inline-block;width:8px;height:8px;background:#ef4444;border-radius:50%;margin-right:8px}

.chart-wrap{height:350px;margin:16px 0}

.callouts{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px}
.callout{border-radius:10px;padding:12px}
.callout.info{background:#eef6ff;border:1px solid #dbeafe}
.callout.warn{background:#fff1f2;border:1px solid #ffe4e6}
.callout-title{font-weight:700;margin-bottom:6px}

.density-pills{display:flex;gap:12px;margin-top:10px}
.pill{background:#f3f4f6;border:1px solid #e5e7eb;border-radius:10px;padding:8px 12px;font-weight:700;text-align:center}
.pill small{display:block;font-weight:500;color:#6b7280}

.two-col{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:12px}
.dot-list{list-style:none;margin:0;padding:0}
.dot-list li{background:#fcfcfd;border:1px solid #eef0f3;border-radius:12px;padding:16px;margin-bottom:12px;line-height:1.6;font-size:14px}
.dot-list .dot:before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:8px;vertical-align:middle}
.dot.red:before{background:#ef4444}
.dot.blue:before{background:#3b82f6}
.dot.green:before{background:#10b981}
.dot.purple:before{background:#8b5cf6}
.dot.orange:before{background:#f59e0b}
.dot.teal:before{background:#14b8a6}

.two-col h4, .two-col h5{margin-top:0;margin-bottom:12px;font-size:16px;color:#1f2937}
.two-col h5{font-size:15px}

.opps{background:#f8fafc;border:1px dashed #e5e7eb;border-radius:12px;padding:20px;margin-top:16px}
.opps h4{margin-top:0;margin-bottom:16px;font-size:17px;color:#1f2937}
.opps p{line-height:1.7;margin-bottom:20px;font-size:14px;color:#374151}
.opps ul{margin:8px 0 16px 0;padding-left:20px}
.opps li{margin-bottom:8px;line-height:1.6;font-size:14px}
.opps .two-col{margin-top:0;gap:20px}

.notice{background:#fffaf0;border-color:#fde68a;padding:24px}
.notice-head{display:flex;gap:12px;align-items:center;margin-bottom:16px}
.notice p{line-height:1.7;margin-bottom:16px;font-size:14px}
.notice ul{margin:12px 0 16px 0;padding-left:20px}
.notice li{margin-bottom:8px;line-height:1.6;font-size:14px}
.notice .icon{width:26px;height:26px;border-radius:50%;background:#fbbf24;color:#000;display:flex;align-items:center;justify-content:center;font-weight:700}
.muted{color:#6b7280}
.small{font-size:12px}

@media (max-width:900px){
  .summary-metrics{grid-template-columns:1fr}
  .two-col{grid-template-columns:1fr;gap:16px}
  .callouts{grid-template-columns:1fr}
  .panel{padding:20px}
  .dot-list li{padding:14px;font-size:13px}
  .opps{padding:16px}
  .opps p{font-size:13px}
  .notice{padding:20px}
  .notice p{font-size:13px}
  .summary-metrics{gap:12px;margin-bottom:16px}
  .metric{padding:10px 6px}
  .metric-value{font-size:20px}
  .kpis{gap:12px;margin:8px 0 20px}
  .kpi-card{padding:14px}
  .obs{padding:12px;margin:8px 0 16px}
}
</style>
