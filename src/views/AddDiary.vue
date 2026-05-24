<template>
  <div class="add-diary">
    <header class="page-header">
      <router-link to="/diaries" class="back">← 返回</router-link>
      <h1>写日记</h1>
    </header>

    <form class="form" @submit.prevent="submit">
      <!-- 心情选择 -->
      <label class="field">
        <span class="label">今天心情</span>
        <div class="mood-grid">
          <div
            v-for="m in moods"
            :key="m.value"
            class="mood-item"
            :class="{ active: mood === m.value }"
            @click="mood = m.value"
          >
            <span class="mood-emoji">{{ m.emoji }}</span>
            <span class="mood-label">{{ m.label }}</span>
          </div>
        </div>
      </label>

      <!-- 标题 -->
      <label class="field">
        <span class="label">标题</span>
        <input v-model="title" type="text" placeholder="给日记起个标题" required />
      </label>

      <!-- 内容 -->
      <label class="field">
        <span class="label">内容</span>
        <textarea v-model="content" placeholder="记录今天的追星故事…" rows="6" required></textarea>
      </label>

      <!-- 日期 -->
      <label class="field">
        <span class="label">日期</span>
        <input v-model="diaryDate" type="date" required @click="$event.target.showPicker()" />
      </label>

      <!-- 关联偶像 -->
      <label class="field">
        <span class="label">关联偶像（可选）</span>
        <select v-model="idolId">
          <option value="">不关联</option>
          <option v-for="idol in idols" :key="idol.id" :value="idol.id">{{ idol.name }}</option>
        </select>
      </label>

      <!-- 关联行程 -->
      <label class="field" v-if="idolId && filteredEvents.length > 0">
        <span class="label">关联行程（可选）</span>
        <select v-model="eventId">
          <option value="">不关联</option>
          <option v-for="ev in filteredEvents" :key="ev.id" :value="ev.id">{{ ev.title }}</option>
        </select>
      </label>

      <!-- 照片上传 -->
      <label class="field">
        <span class="label">照片（最多3张）</span>
        <div class="photo-grid">
          <div v-for="(p, i) in photos" :key="i" class="photo-item">
            <img :src="p" />
            <button type="button" class="photo-remove" @click="removePhoto(i)">✕</button>
          </div>
          <div v-if="photos.length < 3" class="photo-add" @click="pickPhotos">
            <span>＋</span>
            <span class="photo-count">{{ photos.length }}/3</span>
          </div>
        </div>
        <input type="file" ref="photoInput" accept="image/*" multiple hidden @change="onPhotoChange" />
        <!-- 重置 input 以支持重复选择同一文件 -->
      </label>

      <button type="submit" class="submit-btn" :disabled="submitting">
        {{ submitting ? '发布中…' : '发布日记' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getIdols, getEvents, createDiary, uploadImage } from '../api'

const router = useRouter()
const idols = ref([])
const events = ref([])

const mood = ref('happy')
const title = ref('')
const content = ref('')
const diaryDate = ref('')
const idolId = ref('')
const eventId = ref('')
const photos = ref([])
const photoFiles = ref([])
const photoInput = ref(null)
const submitting = ref(false)

const moods = [
  { value: 'excited', emoji: '🤩', label: '兴奋' },
  { value: 'happy', emoji: '😊', label: '开心' },
  { value: 'moved', emoji: '🥹', label: '感动' },
  { value: 'nostalgic', emoji: '🥺', label: '怀念' },
  { value: 'calm', emoji: '😌', label: '平静' },
  { value: 'sad', emoji: '😢', label: '难过' },
]

const filteredEvents = computed(() => {
  if (!idolId.value) return []
  return events.value.filter(e => String(e.idolId) === String(idolId.value))
})

onMounted(async () => {
  try {
    const [idolsData, eventsData] = await Promise.all([getIdols(), getEvents()])
    idols.value = idolsData
    events.value = eventsData
  } catch (e) {
    console.error('加载数据失败:', e)
  }
})

function pickPhotos() {
  photoInput.value.click()
}

function onPhotoChange(e) {
  const files = Array.from(e.target.files)
  const remaining = 3 - photos.value.length
  files.slice(0, remaining).forEach(file => {
    photoFiles.value.push(file)
    photos.value.push(URL.createObjectURL(file))
  })
  // 重置 input value，允许重复选择同一文件时也能触发 change 事件
  e.target.value = ''
}

function removePhoto(i) {
  photos.value.splice(i, 1)
  photoFiles.value.splice(i, 1)
}

async function submit() {
  if (submitting.value) return
  if (!title.value.trim() || !content.value.trim()) {
    alert('请填写标题和内容')
    return
  }
  submitting.value = true
  try {
    const uploadedUrls = []
    for (const file of photoFiles.value) {
      const result = await uploadImage(file)
      uploadedUrls.push(result.url)
    }

    const data = {
      title: title.value.trim(),
      content: content.value.trim(),
      mood: mood.value,
      date: diaryDate.value ? new Date(diaryDate.value).toISOString() : new Date().toISOString(),
      photos: uploadedUrls,
    }
    if (idolId.value) data.idolId = Number(idolId.value)
    if (eventId.value) data.eventId = Number(eventId.value)

    await createDiary(data)
    router.push('/diaries')
  } catch (e) {
    console.error('发布日记失败:', e)
    alert('发布失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.add-diary {
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
.field input, .field select, .field textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 15px;
  box-sizing: border-box;
  font-family: inherit;
}
.field textarea {
  resize: vertical;
  line-height: 1.6;
}

/* 心情选择 */
.mood-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.mood-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 12px;
  border: 2px solid #eee;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 60px;
}
.mood-item.active {
  border-color: #6c5ce7;
  background: #f8f5ff;
}
.mood-emoji { font-size: 24px; }
.mood-label { font-size: 11px; color: #999; margin-top: 4px; }

/* 照片 */
.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.photo-item {
  position: relative;
  width: 80px;
  height: 80px;
}
.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.photo-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 50%;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.photo-add {
  width: 80px;
  height: 80px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #999;
  cursor: pointer;
}
.photo-count {
  font-size: 10px;
  color: #bbb;
  margin-top: 2px;
}

/* 提交 */
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
