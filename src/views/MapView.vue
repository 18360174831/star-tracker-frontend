<template>
  <div class="map-page">
    <!-- 顶部统计栏 -->
    <header class="page-header">
      <h1>🗺️ 场馆地图</h1>
      <div class="stats" v-if="!loading">
        <div class="stat-pill">
          <span class="stat-visited">✅ {{ visitedCount }}</span>
          <span class="stat-sep">/</span>
          <span class="stat-total">📍 {{ allVenues.length }}</span>
        </div>
      </div>
    </header>

    <!-- 地图区域 -->
    <div class="map-wrapper" ref="mapWrapper">
      <div v-if="loading" class="map-loading">
        <div class="loading-spinner"></div>
        <span>加载场馆数据中…</span>
      </div>
      <div v-else class="map-container" ref="mapContainer"
        @mousedown="onPanStart"
        @touchstart="onTouchStart"
        @wheel.prevent="onZoom"
      >
        <!-- SVG 中国地图 -->
        <svg ref="svgRef" class="china-svg"
          :viewBox="viewBox"
          :style="svgStyle"
          @mousedown="onSvgMouseDown"
        >
          <!-- 背景 -->
          <rect :width="svgW" :height="svgH" fill="#f0f4f8" />

          <!-- 国界线 + 省界 -->
          <path v-for="(line, i) in chinaLines" :key="'l'+i"
            :d="line.d"
            fill="none"
            :stroke="line.isNational ? '#8b95a5' : '#c8cfd8'"
            :stroke-width="line.isNational ? 1.2 : 0.4"
            stroke-linejoin="round"
          />

          <!-- 省份填充 -->
          <path v-for="(prov, i) in chinaProvinces" :key="'p'+i"
            :d="prov.d"
            :fill="prov.fill"
            stroke="#d1d8e0"
            stroke-width="0.3"
          />

          <!-- 场馆标记点 -->
          <g v-for="venue in allVenues" :key="'v'+venue.id"
            :transform="`translate(${lngToX(venue.lng)}, ${latToY(venue.lat)})`"
            class="venue-marker"
            @click.stop="selectVenue(venue)"
          >
            <!-- 已去过：彩色光晕 + 大标记 -->
            <template v-if="isVenueVisited(venue.id)">
              <circle r="8" fill="#27ae60" opacity="0.15" class="marker-glow" />
              <circle r="5" :fill="selectedVenue?.id === venue.id ? '#e67e22' : '#27ae60'"
                stroke="#fff" stroke-width="2" class="marker-dot" />
              <text y="1.5" text-anchor="middle" fill="#fff" font-size="5" font-weight="700">✓</text>
            </template>
            <!-- 未去过：灰色标记 -->
            <template v-else>
              <circle r="4" fill="#bdc3c7"
                :stroke="selectedVenue?.id === venue.id ? '#6c5ce7' : 'none'"
                stroke-width="2" class="marker-dot" />
            </template>
          </g>
        </svg>

        <!-- 缩放控件 -->
        <div class="zoom-controls">
          <button class="zoom-btn" @click="zoomIn" title="放大">＋</button>
          <button class="zoom-btn" @click="zoomOut" title="缩小">－</button>
          <button class="zoom-btn reset" @click="resetView" title="重置视图">↺</button>
        </div>

        <!-- 图例 -->
        <div class="map-legend">
          <span class="legend-item"><span class="legend-dot visited"></span>已去</span>
          <span class="legend-item"><span class="legend-dot unvisited"></span>未去</span>
        </div>
      </div>
    </div>

    <!-- 选中场馆详情卡片 -->
    <transition name="slide-up">
      <div v-if="selectedVenue" class="venue-detail-card" @click.stop>
        <div class="vd-top">
          <div class="vd-status" :class="{ visited: isVenueVisited(selectedVenue.id) }">
            {{ isVenueVisited(selectedVenue.id) ? '✅ 已去过' : '⭕ 未去过' }}
          </div>
          <button class="vd-close" @click="selectedVenue = null">✕</button>
        </div>
        <div class="vd-name">{{ selectedVenue.name }}</div>
        <div class="vd-location">📍 {{ selectedVenue.province }} {{ selectedVenue.city }}</div>
        <div class="vd-coords">🧭 {{ selectedVenue.lat?.toFixed(4) }}, {{ selectedVenue.lng?.toFixed(4) }}</div>
        <button class="vd-visit-btn"
          :class="{ visited: isVenueVisited(selectedVenue.id) }"
          @click="toggleVisited(selectedVenue)">
          {{ isVenueVisited(selectedVenue.id) ? '⬜ 取消标记' : '✅ 标记为已去过' }}
        </button>
      </div>
    </transition>

    <!-- 场馆列表（可折叠浮层） -->
    <div class="venue-list-panel" :class="{ collapsed: listCollapsed }">
      <div class="panel-header" @click="listCollapsed = !listCollapsed">
        <div class="panel-title">
          <span>📋 场馆列表</span>
          <span class="panel-count" v-if="!loading">
            已去 {{ visitedCount }} · 未去 {{ allVenues.length - visitedCount }}
          </span>
        </div>
        <span class="panel-toggle">{{ listCollapsed ? '▲ 展开' : '▼ 收起' }}</span>
      </div>
      <div class="panel-body" v-show="!listCollapsed">
        <!-- 筛选 -->
        <div class="list-filters">
          <button class="filter-btn" :class="{ active: filter === 'all' }" @click="filter = 'all'">
            全部 ({{ allVenues.length }})
          </button>
          <button class="filter-btn" :class="{ active: filter === 'visited' }" @click="filter = 'visited'">
            已去过 ({{ visitedCount }})
          </button>
          <button class="filter-btn" :class="{ active: filter === 'unvisited' }" @click="filter = 'unvisited'">
            未去过 ({{ allVenues.length - visitedCount }})
          </button>
        </div>
        <!-- 场馆条目 -->
        <div class="venue-scroll">
          <div v-for="(venue, idx) in filteredVenues" :key="venue.id"
            class="venue-item"
            :class="{
              visited: isVenueVisited(venue.id),
              selected: selectedVenue?.id === venue.id
            }"
            @click="focusVenue(venue)"
          >
            <span class="vi-index">{{ idx + 1 }}</span>
            <span class="vi-status">{{ isVenueVisited(venue.id) ? '✅' : '⭕' }}</span>
            <div class="vi-info">
              <div class="vi-name">{{ venue.name }}</div>
              <div class="vi-city">{{ venue.province }} {{ venue.city }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { getAllVenues, getVisitedVenues, markVenueVisited, unmarkVenueVisited } from '../api'

// ========== 数据 ==========
const allVenues = ref([])
const visitedVenues = ref([])
const loading = ref(true)
const selectedVenue = ref(null)
const filter = ref('all')
const listCollapsed = ref(false)

// ========== SVG 参数 ==========
const svgW = 800
const svgH = 600
const viewBox = `0 0 ${svgW} ${svgH}`
const LNG_MIN = 73, LNG_MAX = 136
const LAT_MIN = 3, LAT_MAX = 54

// ========== 缩放/平移 ==========
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)
const svgRef = ref(null)
let isPanning = false
let startX = 0, startY = 0

const svgStyle = computed(() => ({
  transform: `scale(${zoom.value}) translate(${panX.value}px, ${panY.value}px)`,
  transformOrigin: 'center center',
  transition: isPanning ? 'none' : 'transform 0.2s ease-out',
}))

// ========== 计算属性 ==========
const visitedCount = computed(() => visitedVenues.value.length)

const filteredVenues = computed(() => {
  if (filter.value === 'visited') return allVenues.value.filter(v => isVenueVisited(v.id))
  if (filter.value === 'unvisited') return allVenues.value.filter(v => !isVenueVisited(v.id))
  return allVenues.value
})

// ========== 坐标映射 ==========
function lngToX(lng) {
  return ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * (svgW - 80) + 40
}
function latToY(lat) {
  return ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (svgH - 80) + 40
}

// ========== 简化中国地图 ==========
// 国界线（中国大陆轮廓）
const chinaOutlinePath = [
  'M 680,20 L 700,30 720,25 740,40 730,60 710,80 730,100 750,130 760,160 770,190 760,220 750,250 740,280 720,310 700,340 680,360 660,380 640,400 620,420 600,440 580,460 560,470 540,480 520,490 500,495 480,500 460,490 440,480 420,470 400,460 380,440 360,420 340,400 320,380 300,360 280,340 260,320 240,300 220,280 200,260 180,240 160,220 140,200 130,180 140,160 160,140 180,120 200,100 220,80 240,70 260,60 280,50 300,40 320,35 340,30 360,25 380,20 400,18 420,20 440,25 460,30 480,35 500,30 520,25 540,22 560,20 580,18 600,15 620,14 640,15 660,18 Z'
].join(' ')

// 省界线（主要省界简化版）
const provinceBorderPaths = [
  // 东北：黑龙江/吉林/辽宁
  'M 700,20 L 680,50 700,80 720,60 740,40',
  // 东北：辽宁/河北
  'M 660,100 L 680,120 700,110 720,130',
  // 华北：河北/北京/天津
  'M 620,90 L 640,100 660,95 680,110',
  // 华北：山西/河北
  'M 580,100 L 600,110 620,100 640,120',
  // 华东：山东
  'M 640,140 L 660,150 680,140 700,160',
  // 华东：江苏/安徽
  'M 660,170 L 680,180 700,170 720,190',
  // 华东：浙江/福建
  'M 680,210 L 700,220 720,210 740,230',
  // 华中：河南/湖北
  'M 560,170 L 580,180 600,170 620,190',
  // 华中：湖北/湖南
  'M 540,210 L 560,220 580,210 600,230',
  // 华南：广东/广西
  'M 520,280 L 540,290 560,280 580,300',
  // 西南：四川/重庆
  'M 380,180 L 400,190 420,180 440,200',
  // 西南：四川/云南
  'M 340,240 L 360,250 380,240 400,260',
  // 西北：陕西/甘肃
  'M 380,100 L 400,110 420,100 440,120',
  // 西北：甘肃/新疆
  'M 200,60 L 220,70 240,60 260,80',
  // 西藏
  'M 160,160 L 180,170 200,160 220,180',
  // 青海/西藏
  'M 260,140 L 280,150 300,140 320,160',
]

const chinaLines = computed(() => {
  const lines = [
    { d: chinaOutlinePath, isNational: true },
    ...provinceBorderPaths.map(d => ({ d, isNational: false }))
  ]
  return lines
})

// 省份区域填充
const chinaProvinces = computed(() => {
  const provinces = [...new Set(allVenues.value.map(v => v.province))]
  return provinces.map(prov => {
    const venues = allVenues.value.filter(v => v.province === prov)
    const cx = venues.reduce((s, v) => s + lngToX(v.lng), 0) / venues.length
    const cy = venues.reduce((s, v) => s + latToY(v.lat), 0) / venues.length
    const visited = venues.some(v => isVenueVisited(v.id))
    const r = 28
    return {
      d: `M ${cx},${cy-r} C ${cx+r},${cy-r} ${cx+r},${cy+r} ${cx},${cy+r} C ${cx-r},${cy+r} ${cx-r},${cy-r} ${cx},${cy-r} Z`,
      fill: visited ? '#ede7ff' : '#f5f7fa'
    }
  })
})

// ========== 交互 ==========
function isVenueVisited(venueId) {
  return visitedVenues.value.some(v => v.venue_id === venueId || v.venueId === venueId)
}

function selectVenue(venue) {
  selectedVenue.value = selectedVenue.value?.id === venue.id ? null : venue
}

function focusVenue(venue) {
  selectedVenue.value = venue
  // 计算偏移让标记居中
  const svgBounds = svgRef.value?.getBoundingClientRect()
  if (!svgBounds) return
  const mx = lngToX(venue.lng)
  const my = latToY(venue.lat)
  const cx = svgW / 2
  const cy = svgH / 2
  panX.value = (cx - mx) / zoom.value * 0.6
  panY.value = (cy - my) / zoom.value * 0.6
  zoom.value = Math.max(zoom.value, 1.5)
}

async function toggleVisited(venue) {
  try {
    const existing = visitedVenues.value.find(v => v.venue_id === venue.id || v.venueId === venue.id)
    if (existing) {
      await unmarkVenueVisited(existing.id)
      visitedVenues.value = visitedVenues.value.filter(v => v.id !== existing.id)
    } else {
      const result = await markVenueVisited(venue.id)
      visitedVenues.value.push(result)
    }
  } catch (e) {
    console.error('操作失败:', e)
    alert('操作失败，请重试')
  }
}

// 缩放
function zoomIn() { zoom.value = Math.min(zoom.value + 0.3, 4) }
function zoomOut() { zoom.value = Math.max(zoom.value - 0.3, 0.5) }
function resetView() { zoom.value = 1; panX.value = 0; panY.value = 0 }

// 平移
function onPanStart(e) {
  isPanning = true
  startX = e.clientX - panX.value * zoom.value
  startY = e.clientY - panY.value * zoom.value
  document.addEventListener('mousemove', onPanning)
  document.addEventListener('mouseup', onPanEnd)
}
function onPanning(e) {
  if (!isPanning) return
  panX.value = (e.clientX - startX) / zoom.value
  panY.value = (e.clientY - startY) / zoom.value
}
function onPanEnd() {
  isPanning = false
  document.removeEventListener('mousemove', onPanning)
  document.removeEventListener('mouseup', onPanEnd)
}

function onSvgMouseDown(e) {
  if (e.target.closest('.venue-marker')) return
  onPanStart(e)
}

function onTouchStart(e) {
  if (e.touches.length === 1) {
    isPanning = true
    startX = e.touches[0].clientX - panX.value * zoom.value
    startY = e.touches[0].clientY - panY.value * zoom.value
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
  }
}
function onTouchMove(e) {
  if (!isPanning) return
  e.preventDefault()
  panX.value = (e.touches[0].clientX - startX) / zoom.value
  panY.value = (e.touches[0].clientY - startY) / zoom.value
}
function onTouchEnd() {
  isPanning = false
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
}

function onZoom(e) {
  const delta = e.deltaY > 0 ? -0.15 : 0.15
  zoom.value = Math.max(0.5, Math.min(4, zoom.value + delta))
}

// ========== 初始化 ==========
onMounted(async () => {
  try {
    const [venuesData, visitedData] = await Promise.all([
      getAllVenues(),
      getVisitedVenues()
    ])
    allVenues.value = Array.isArray(venuesData) ? venuesData : []
    visitedVenues.value = Array.isArray(visitedData) ? visitedData : []
  } catch (e) {
    console.error('加载场馆数据失败:', e)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onPanning)
  document.removeEventListener('mouseup', onPanEnd)
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
})
</script>

<style scoped>
/* ========== 全局 ========== */
.map-page {
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

/* ========== 顶部统计 ========== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
  z-index: 10;
}
.page-header h1 { margin: 0; font-size: 18px; font-weight: 700; }
.stat-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f8f5ff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}
.stat-visited { color: #27ae60; }
.stat-sep { color: #ccc; margin: 0 2px; }
.stat-total { color: #6c5ce7; }

/* ========== 地图区域（占满上半部分） ========== */
.map-wrapper {
  position: relative;
  width: 100%;
  height: 60vh;
  min-height: 350px;
  background: #e8ecf1;
  overflow: hidden;
  flex-shrink: 0;
}
.map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #999;
  font-size: 14px;
}
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e0e0;
  border-top-color: #6c5ce7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.map-container {
  width: 100%;
  height: 100%;
  cursor: grab;
  position: relative;
}
.map-container:active { cursor: grabbing; }

.china-svg {
  width: 100%;
  height: 100%;
}

/* ========== 场馆标记 ========== */
.venue-marker {
  cursor: pointer;
}
.venue-marker .marker-dot {
  transition: r 0.15s, fill 0.15s;
}
.venue-marker:hover .marker-dot {
  r: 6;
}
.marker-glow {
  animation: glow-pulse 2s ease-in-out infinite;
}
@keyframes glow-pulse {
  0%, 100% { opacity: 0.15; r: 8; }
  50% { opacity: 0.25; r: 10; }
}

/* ========== 缩放控件 ========== */
.zoom-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 5;
}
.zoom-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: background 0.15s;
}
.zoom-btn:active { background: #f0f0f0; }
.zoom-btn.reset { font-size: 16px; }

/* ========== 图例 ========== */
.map-legend {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  gap: 12px;
  background: rgba(255,255,255,0.92);
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  color: #666;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  z-index: 5;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.legend-dot.visited { background: #27ae60; }
.legend-dot.unvisited { background: #bdc3c7; }

/* ========== 选中场馆详情 ========== */
.venue-detail-card {
  margin: 12px 16px;
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 4px 16px rgba(108,92,231,0.12);
  border-left: 4px solid #6c5ce7;
  flex-shrink: 0;
}
.vd-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.vd-status {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
  background: #f0f0f0;
  color: #999;
}
.vd-status.visited {
  background: #e8f8f0;
  color: #27ae60;
}
.vd-close {
  width: 28px;
  height: 28px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}
.vd-name {
  font-size: 17px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}
.vd-location {
  font-size: 13px;
  color: #666;
  margin-bottom: 2px;
}
.vd-coords {
  font-size: 11px;
  color: #bbb;
  margin-bottom: 10px;
}
.vd-visit-btn {
  width: 100%;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 10px;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}
.vd-visit-btn:hover { border-color: #27ae60; }
.vd-visit-btn.visited {
  border-color: #e74c3c;
  color: #e74c3c;
  background: #fff5f5;
}

/* ========== 场馆列表（可折叠浮层） ========== */
.venue-list-panel {
  margin: 0 12px 16px;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  transition: max-height 0.3s ease;
}
.venue-list-panel.collapsed {
  max-height: 48px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
.panel-count {
  font-size: 12px;
  color: #999;
  font-weight: 400;
}
.panel-toggle {
  font-size: 12px;
  color: #6c5ce7;
  cursor: pointer;
}

.panel-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 筛选按钮 */
.list-filters {
  display: flex;
  gap: 6px;
  padding: 10px 14px 6px;
  flex-shrink: 0;
}
.filter-btn {
  padding: 5px 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  color: #999;
  transition: all 0.15s;
}
.filter-btn.active {
  border-color: #6c5ce7;
  background: #f8f5ff;
  color: #6c5ce7;
  font-weight: 500;
}

/* 场馆列表滚动 */
.venue-scroll {
  flex: 1;
  overflow-y: auto;
  max-height: 200px;
  padding: 0 14px 10px;
}

/* 场馆条目 */
.venue-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.15s;
}
.venue-item:last-child { border-bottom: none; }
.venue-item:active { background: #f8f9fa; }
.venue-item.selected { background: #faf8ff; border-radius: 8px; padding: 10px 8px; }

.vi-index {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: #f0f0f0;
  color: #999;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.venue-item.visited .vi-index {
  background: #e8f8f0;
  color: #27ae60;
}

.vi-status {
  font-size: 14px;
  flex-shrink: 0;
}

.vi-info {
  flex: 1;
  min-width: 0;
}
.vi-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.vi-city {
  font-size: 11px;
  color: #999;
  margin-top: 1px;
}

/* ========== 过渡动画 ========== */
.slide-up-enter-active { animation: slideUp 0.25s ease-out; }
.slide-up-leave-active { animation: slideUp 0.2s ease-in reverse; }
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== 响应式 ========== */
@media (min-width: 768px) {
  .map-page {
    max-width: 480px;
    margin: 0 auto;
  }
  .venue-scroll { max-height: 260px; }
}
</style>
