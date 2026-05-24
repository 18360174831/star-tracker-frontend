<template>
  <div class="home">
    <header class="header">
      <h1>⭐ 追星记录</h1>
      <p class="subtitle">距离下次见面还有…</p>
    </header>

    <div class="countdown-list">
      <div v-if="loading" class="empty">加载中…</div>
      <div v-else-if="upcoming.length === 0" class="empty">还没有行程，快去添加吧 ✨</div>
      <div
        v-for="event in upcoming"
        :key="event.id"
        class="countdown-card"
        @click="selectedEvent = event"
      >
        <!-- 封面照片区域 -->
        <div class="card-cover" v-if="event.photos && event.photos.length > 0">
          <img :src="event.photos[0]" class="cover-img" />
        </div>
        <div class="card-cover card-cover-placeholder" v-else>
          <span class="placeholder-icon">🎤</span>
        </div>
        <!-- 倒数日 + 文字信息 -->
        <div class="card-info">
          <div class="countdown-row">
            <span class="countdown-number">{{ getDaysLeft(event.date) }}</span>
            <span class="countdown-unit">天</span>
          </div>
          <div class="idol-tag">{{ event.idolName }}</div>
          <div class="event-title">{{ event.title }}</div>
          <div class="event-meta">
            📅 {{ formatDate(event.date) }} · 📍 {{ event.location }}
          </div>
        </div>
      </div>
    </div>

    <div class="section-title" v-if="past.length > 0">
      <span>已结束的行程</span>
    </div>
    <div class="past-list">
      <div v-for="event in past" :key="event.id" class="past-card">
        <div class="past-cover" v-if="event.photos && event.photos.length > 0">
          <img :src="event.photos[0]" />
        </div>
        <div class="past-info">
          <span class="idol-tag small">{{ event.idolName }}</span>
          <span class="event-title-sm">{{ event.title }}</span>
        </div>
        <div class="past-meta">已过去 {{ Math.abs(getDaysLeft(event.date)) }} 天</div>
      </div>
    </div>

    <!-- Event detail modal -->
    <div v-if="selectedEvent" class="modal-overlay" @click.self="selectedEvent = null">
      <div class="modal">
        <button class="modal-close" @click="selectedEvent = null">✕</button>
        <h2>{{ selectedEvent.title }}</h2>
        <div class="modal-idol">{{ selectedEvent.idolName }}</div>
        <div class="modal-info">
          <p>📅 {{ formatDate(selectedEvent.date) }}</p>
          <p>📍 {{ selectedEvent.location }}</p>
          <p>⏳ 还有 {{ getDaysLeft(selectedEvent.date) }} 天</p>
        </div>
        <div v-if="selectedEvent.photos && selectedEvent.photos.length > 0" class="modal-photos">
          <img v-for="(p, i) in selectedEvent.photos" :key="i" :src="p" alt="photo" />
        </div>
      </div>
    </div>

    <router-link to="/add-event" class="fab">＋</router-link>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getEvents } from '../api'

const events = ref([])
const loading = ref(true)
const selectedEvent = ref(null)

onMounted(async () => {
  try {
    events.value = await getEvents()
  } catch (e) {
    console.error('加载行程失败:', e)
  } finally {
    loading.value = false
  }
})

const now = new Date()
const upcoming = computed(() =>
  events.value
    .filter(e => new Date(e.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
)
const past = computed(() =>
  events.value
    .filter(e => new Date(e.date) <= now)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
)

function getDaysLeft(dateStr) {
  const target = new Date(dateStr)
  const diff = target - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.home {
  padding: 0 0 80px 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.header {
  text-align: center;
  padding: 40px 20px 20px;
  color: #fff;
}
.header h1 { font-size: 24px; margin: 0; }
.subtitle { font-size: 14px; opacity: 0.8; margin-top: 6px; }

/* 倒数日卡片 - 名片样式 */
.countdown-list { padding: 0 16px; }
.countdown-card {
  display: flex;
  background: #fff;
  border-radius: 14px;
  margin-bottom: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.15s;
}
.countdown-card:active { transform: scale(0.98); }

.card-cover {
  width: 100px;
  min-height: 100px;
  flex-shrink: 0;
  overflow: hidden;
}
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.card-cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0edff, #ede8ff);
}
.placeholder-icon { font-size: 36px; }

.card-info {
  flex: 1;
  padding: 12px 14px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.countdown-row {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-bottom: 4px;
}
.countdown-number {
  font-size: 32px;
  font-weight: 800;
  color: #6c5ce7;
  line-height: 1;
}
.countdown-unit {
  font-size: 12px;
  color: #999;
}
.idol-tag {
  display: inline-block;
  background: #f0edff;
  color: #6c5ce7;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  margin-bottom: 4px;
  align-self: flex-start;
}
.event-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.event-meta {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-title {
  padding: 20px 16px 8px;
  color: rgba(255,255,255,0.7);
  font-size: 13px;
}
.past-list { padding: 0 16px; }
.past-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 10px 14px;
  margin-bottom: 8px;
}
.past-cover {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}
.past-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.past-info { flex: 1; display: flex; align-items: center; gap: 8px; min-width: 0; }
.idol-tag.small { font-size: 10px; }
.event-title-sm {
  font-size: 13px;
  color: rgba(255,255,255,0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.past-meta { font-size: 12px; color: rgba(255,255,255,0.6); white-space: nowrap; }

.fab {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: #6c5ce7;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(108,92,231,0.4);
  z-index: 50;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}
.modal {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}
.modal-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
}
.modal h2 { margin: 0 0 4px; font-size: 18px; }
.modal-idol { color: #6c5ce7; font-size: 13px; margin-bottom: 12px; }
.modal-info p { margin: 4px 0; font-size: 14px; color: #555; }
.modal-photos { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.modal-photos img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; }
.empty { text-align: center; color: rgba(255,255,255,0.7); padding: 60px 20px; font-size: 15px; }
</style>
