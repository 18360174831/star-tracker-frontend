<template>
  <div class="diaries-page">
    <header class="page-header">
      <h1>📝 追星日记</h1>
      <div class="filter-bar">
        <select v-model="filterMood" @change="loadDiaries">
          <option value="">全部心情</option>
          <option v-for="m in moods" :key="m.value" :value="m.value">{{ m.emoji }} {{ m.label }}</option>
        </select>
        <select v-model="filterIdol" @change="loadDiaries">
          <option value="">全部偶像</option>
          <option v-for="idol in idols" :key="idol.id" :value="idol.id">{{ idol.name }}</option>
        </select>
      </div>
    </header>

    <div class="timeline">
      <div v-if="loading" class="empty">加载中…</div>
      <div v-else-if="diaries.length === 0" class="empty">
        还没有日记，记录你的追星瞬间吧 ✨
      </div>

      <div v-for="diary in diaries" :key="diary.id" class="diary-card" @click="goDetail(diary.id)">
        <div class="card-header">
          <span class="mood-emoji">{{ getMoodEmoji(diary.mood) }}</span>
          <span class="diary-date">{{ formatDate(diary.date || diary.createdAt) }}</span>
        </div>
        <div class="card-title">{{ diary.title }}</div>
        <div class="card-content">{{ diary.content }}</div>
        <div class="card-meta">
          <span v-if="diary.idolName" class="idol-tag">{{ diary.idolName }}</span>
          <span v-if="diary.eventTitle" class="event-tag">📅 {{ diary.eventTitle }}</span>
        </div>
        <div v-if="diary.photos && diary.photos.length > 0" class="card-photos">
          <img v-for="(p, i) in diary.photos.slice(0, 3)" :key="i" :src="p" class="photo-thumb" />
          <span v-if="diary.photos.length > 3" class="photo-more">+{{ diary.photos.length - 3 }}</span>
        </div>
      </div>
    </div>

    <div v-if="hasMore && !loading" class="load-more" @click="loadMore">加载更多</div>

    <router-link to="/add-diary" class="fab">＋</router-link>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDiaries, getIdols } from '../api'

const router = useRouter()
const diaries = ref([])
const idols = ref([])
const loading = ref(true)
const page = ref(1)
const hasMore = ref(false)
const filterMood = ref('')
const filterIdol = ref('')

const moods = [
  { value: 'excited', emoji: '🤩', label: '兴奋' },
  { value: 'happy', emoji: '😊', label: '开心' },
  { value: 'moved', emoji: '🥹', label: '感动' },
  { value: 'nostalgic', emoji: '🥺', label: '怀念' },
  { value: 'calm', emoji: '😌', label: '平静' },
  { value: 'sad', emoji: '😢', label: '难过' },
]

function getMoodEmoji(mood) {
  const found = moods.find(m => m.value === mood)
  return found ? found.emoji : '📝'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

async function loadDiaries() {
  loading.value = true
  page.value = 1
  try {
    const params = { page: 1, pageSize: 20 }
    if (filterMood.value) params.mood = filterMood.value
    if (filterIdol.value) params.idolId = filterIdol.value
    const result = await getDiaries(params)
    // 兼容两种返回格式：数组 或 {data: [...], hasMore: bool}
    if (Array.isArray(result)) {
      diaries.value = result
      hasMore.value = false
    } else {
      diaries.value = result.data || result
      hasMore.value = result.hasMore || false
    }
  } catch (e) {
    console.error('加载日记列表失败:', e)
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  page.value++
  try {
    const params = { page: page.value, pageSize: 20 }
    if (filterMood.value) params.mood = filterMood.value
    if (filterIdol.value) params.idolId = filterIdol.value
    const result = await getDiaries(params)
    const items = Array.isArray(result) ? result : (result.data || [])
    diaries.value.push(...items)
    hasMore.value = Array.isArray(result) ? items.length >= 20 : (result.hasMore || false)
  } catch (e) {
    console.error('加载更多失败:', e)
  }
}

function goDetail(id) {
  router.push(`/diary/${id}`)
}

onMounted(async () => {
  try {
    idols.value = await getIdols()
  } catch (e) {
    console.error('加载偶像列表失败:', e)
  }
  loadDiaries()
})
</script>

<style scoped>
.diaries-page {
  padding-bottom: 80px;
  min-height: 100vh;
  background: #f8f9fa;
}
.page-header {
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.page-header h1 { margin: 0 0 12px; font-size: 20px; }
.filter-bar {
  display: flex;
  gap: 8px;
}
.filter-bar select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
}
.timeline { padding: 12px 16px; }
.diary-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: transform 0.15s;
}
.diary-card:active { transform: scale(0.98); }
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.mood-emoji { font-size: 24px; }
.diary-date { font-size: 12px; color: #999; }
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}
.card-content {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px;
}
.card-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.idol-tag {
  background: #f0edff;
  color: #6c5ce7;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}
.event-tag {
  background: #fff3e0;
  color: #e67e22;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}
.card-photos {
  display: flex;
  gap: 6px;
  align-items: center;
}
.photo-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}
.photo-more {
  font-size: 13px;
  color: #999;
  margin-left: 4px;
}
.load-more {
  text-align: center;
  padding: 14px;
  color: #6c5ce7;
  font-size: 14px;
  cursor: pointer;
}
.empty {
  text-align: center;
  color: #999;
  padding: 60px 20px;
}
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
</style>
