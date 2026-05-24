<template>
  <div class="add-event">
    <header class="page-header">
      <router-link to="/" class="back">← 返回</router-link>
      <h1>添加行程</h1>
    </header>
    <form class="form" @submit.prevent="submit">
      <label class="field">
        <span class="label">选择偶像</span>
        <select v-model="idolId" required>
          <option value="" disabled>请选择</option>
          <option v-for="idol in idols" :key="idol.id" :value="idol.id">{{ idol.name }}</option>
        </select>
      </label>

      <label class="field">
        <span class="label">事件名称</span>
        <input v-model="title" type="text" placeholder="如：演唱会、见面会" required />
      </label>

      <label class="field">
        <span class="label">时间</span>
        <input v-model="date" type="datetime-local" required />
      </label>

      <!-- 三级联动：省份 → 城市 → 场馆 -->
      <label class="field">
        <span class="label">地点</span>
        <div class="cascade-selects">
          <select v-model="selectedProvince" @change="onProvinceChange" class="cascade-select">
            <option value="" disabled>选择省份</option>
            <option v-for="p in provinces" :key="p" :value="p">{{ p }}</option>
          </select>
          <select v-model="selectedCity" @change="onCityChange" :disabled="!selectedProvince" class="cascade-select">
            <option value="" disabled>选择城市</option>
            <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
          </select>
          <select v-model="selectedVenueId" @change="onVenueChange" :disabled="!selectedCity" class="cascade-select">
            <option value="" disabled>选择场馆</option>
            <option v-for="v in venueList" :key="v.id" :value="v.id">{{ v.name }}</option>
          </select>
        </div>
        <div v-if="selectedVenue" class="venue-info">
          <span class="venue-name">📍 {{ selectedVenue.name }}</span>
          <span class="venue-coords">{{ selectedVenue.lat?.toFixed(4) }}, {{ selectedVenue.lng?.toFixed(4) }}</span>
        </div>
      </label>

      <!-- 已去过标记 -->
      <div v-if="selectedVenue" class="visited-toggle">
        <button
          type="button"
          class="visited-btn"
          :class="{ visited: isVisited }"
          @click="toggleVisited"
        >
          {{ isVisited ? '✅ 已去过' : '🏟️ 标记为已去过' }}
        </button>
      </div>

      <!-- 封面照片 -->
      <label class="field">
        <span class="label">封面照片（1张）</span>
        <div class="cover-photo-area" v-if="photoPreview">
          <img :src="photoPreview" class="cover-preview" />
          <button type="button" class="photo-remove" @click="removePhoto">✕</button>
        </div>
        <div v-else class="photo-add" @click="pickPhotos">
          <span class="photo-add-icon">📷</span>
          <span class="photo-add-text">点击上传封面</span>
        </div>
        <input type="file" ref="photoInput" accept="image/*" hidden @change="onPhotoChange" />
      </label>

      <button type="submit" class="submit-btn" :disabled="submitting">
        {{ submitting ? '保存中…' : '保存行程' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  getIdols, createEvent, uploadImage,
  getVenueProvinces, getVenueCities, getVenueList,
  getVisitedVenues, markVenueVisited, unmarkVenueVisited
} from '../api'

const router = useRouter()
const idols = ref([])
const idolId = ref('')
const title = ref('')
const date = ref('')

// 场馆三级联动
const provinces = ref([])
const cities = ref([])
const venueList = ref([])
const selectedProvince = ref('')
const selectedCity = ref('')
const selectedVenueId = ref('')
const selectedVenue = ref(null)

// 已去过状态
const visitedVenues = ref([])
const isVisited = ref(false)
const visitedRecordId = ref(null)

// 照片
const photoPreview = ref('')
const photoFile = ref(null)
const photoInput = ref(null)
const submitting = ref(false)

onMounted(async () => {
  try {
    const [idolsData, provincesData, visitedData] = await Promise.all([
      getIdols(),
      getVenueProvinces(),
      getVisitedVenues()
    ])
    idols.value = idolsData
    provinces.value = provincesData
    visitedVenues.value = Array.isArray(visitedData) ? visitedData : []
  } catch (e) {
    console.error('加载数据失败:', e)
  }
})

// 省份变化 → 加载城市
async function onProvinceChange() {
  selectedCity.value = ''
  selectedVenueId.value = ''
  selectedVenue.value = null
  cities.value = []
  venueList.value = []
  if (!selectedProvince.value) return
  try {
    cities.value = await getVenueCities(selectedProvince.value)
  } catch (e) {
    console.error('加载城市失败:', e)
  }
}

// 城市变化 → 加载场馆
async function onCityChange() {
  selectedVenueId.value = ''
  selectedVenue.value = null
  venueList.value = []
  if (!selectedCity.value) return
  try {
    venueList.value = await getVenueList(selectedProvince.value, selectedCity.value)
  } catch (e) {
    console.error('加载场馆失败:', e)
  }
}

// 场馆变化 → 更新选中场馆 + 检查已去过状态
function onVenueChange() {
  const venue = venueList.value.find(v => v.id === Number(selectedVenueId.value))
  selectedVenue.value = venue || null
  if (venue) {
    const visited = visitedVenues.value.find(v => v.venue_id === venue.id || v.venueId === venue.id)
    isVisited.value = !!visited
    visitedRecordId.value = visited ? visited.id : null
  } else {
    isVisited.value = false
    visitedRecordId.value = null
  }
}

// 标记/取消已去过
async function toggleVisited() {
  if (!selectedVenue.value) return
  try {
    if (isVisited.value && visitedRecordId.value) {
      await unmarkVenueVisited(visitedRecordId.value)
      isVisited.value = false
      visitedRecordId.value = null
      visitedVenues.value = visitedVenues.value.filter(v => v.id !== visitedRecordId.value)
    } else {
      const result = await markVenueVisited(selectedVenue.value.id)
      isVisited.value = true
      visitedRecordId.value = result.id
      visitedVenues.value.push(result)
    }
  } catch (e) {
    console.error('操作失败:', e)
    alert('操作失败，请重试')
  }
}

function pickPhotos() {
  photoInput.value.click()
}

function onPhotoChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
  e.target.value = ''
}

function removePhoto() {
  photoFile.value = null
  photoPreview.value = ''
}

async function submit() {
  if (submitting.value) return
  submitting.value = true
  try {
    let coverUrl = ''
    if (photoFile.value) {
      const result = await uploadImage(photoFile.value)
      coverUrl = result.url
    }
    const dateStr = new Date(date.value).toISOString()
    await createEvent({
      idolId: Number(idolId.value),
      title: title.value,
      date: dateStr,
      location: selectedVenue.value?.name || '',
      lat: selectedVenue.value?.lat || null,
      lng: selectedVenue.value?.lng || null,
      photos: coverUrl ? [coverUrl] : [],
    })
    router.push('/')
  } catch (e) {
    console.error('保存行程失败:', e)
    alert('保存失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.add-event {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 30px;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.page-header h1 { margin: 0; font-size: 18px; flex: 1; }
.back { color: #6c5ce7; text-decoration: none; font-size: 14px; }
.form { padding: 20px 16px; }
.field { display: block; margin-bottom: 20px; }
.label { display: block; font-size: 13px; color: #666; margin-bottom: 6px; }
.field input, .field select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 15px;
  box-sizing: border-box;
}

/* 三级联动下拉 */
.cascade-selects {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cascade-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 14px;
  background: #fff;
  box-sizing: border-box;
}
.cascade-select:disabled {
  background: #f5f5f5;
  color: #bbb;
}
.venue-info {
  margin-top: 10px;
  padding: 10px 14px;
  background: #f8f5ff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.venue-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.venue-coords {
  font-size: 11px;
  color: #999;
}

/* 已去过按钮 */
.visited-toggle {
  margin-bottom: 20px;
}
.visited-btn {
  padding: 10px 20px;
  border: 2px solid #ddd;
  border-radius: 10px;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.visited-btn.visited {
  border-color: #27ae60;
  background: #f0fff0;
  color: #27ae60;
}

/* 封面照片 */
.cover-photo-area {
  position: relative;
  width: 160px;
  height: 100px;
  border-radius: 10px;
  overflow: hidden;
}
.cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.photo-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border: none;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.photo-add {
  width: 160px;
  height: 100px;
  border: 2px dashed #ddd;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  gap: 6px;
}
.photo-add-icon { font-size: 28px; }
.photo-add-text { font-size: 12px; color: #999; }

/* 提交按钮 */
.submit-btn {
  width: 100%;
  padding: 14px;
  background: #6c5ce7;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
}
.submit-btn:disabled { opacity: 0.5; }
</style>
