<template>
  <div class="diary-detail">
    <header class="page-header">
      <router-link to="/diaries" class="back">← 返回</router-link>
      <h1>日记详情</h1>
    </header>

    <div v-if="loading" class="empty">加载中…</div>
    <div v-else-if="!diary" class="empty">日记不存在 😢</div>
    <div v-else class="detail-content">
      <!-- 心情 + 日期 -->
      <div class="detail-header">
        <span class="mood-emoji">{{ getMoodEmoji(diary.mood) }}</span>
        <div class="header-info">
          <div class="detail-date">{{ formatDate(diary.date || diary.createdAt) }}</div>
          <div class="mood-label">{{ getMoodLabel(diary.mood) }}</div>
        </div>
        <div class="header-actions">
          <button class="btn-edit" @click="editing = true" v-if="!editing">编辑</button>
          <button class="btn-del" @click="handleDelete">删除</button>
        </div>
      </div>

      <!-- 标题 -->
      <div v-if="!editing" class="detail-title">{{ diary.title }}</div>
      <input v-else v-model="editTitle" class="edit-input" placeholder="标题" />

      <!-- 内容 -->
      <div v-if="!editing" class="detail-body">{{ diary.content }}</div>
      <textarea v-else v-model="editContent" class="edit-textarea" rows="8" placeholder="内容"></textarea>

      <!-- 关联信息 -->
      <div class="detail-meta">
        <span v-if="diary.idolName" class="idol-tag">⭐ {{ diary.idolName }}</span>
        <span v-if="diary.eventTitle" class="event-tag">📅 {{ diary.eventTitle }}</span>
      </div>

      <!-- 照片画廊 -->
      <div v-if="diary.photos && diary.photos.length > 0" class="gallery">
        <div class="gallery-title">📷 照片（{{ diary.photos.length }}张）</div>
        <div class="gallery-grid">
          <img
            v-for="(p, i) in diary.photos"
            :key="i"
            :src="p"
            class="gallery-photo"
            @click="openPreview(i)"
          />
        </div>
      </div>

      <!-- 编辑模式下的心情选择 -->
      <div v-if="editing" class="edit-section">
        <div class="label">心情</div>
        <div class="mood-grid">
          <div
            v-for="m in moods"
            :key="m.value"
            class="mood-item"
            :class="{ active: editMood === m.value }"
            @click="editMood = m.value"
          >
            <span class="mood-emoji-sm">{{ m.emoji }}</span>
            <span class="mood-label-sm">{{ m.label }}</span>
          </div>
        </div>
      </div>

      <!-- 编辑操作按钮 -->
      <div v-if="editing" class="edit-actions">
        <button class="btn-cancel" @click="cancelEdit">取消</button>
        <button class="btn-save" @click="saveEdit" :disabled="saving">
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </div>
    </div>

    <!-- 照片预览 -->
    <div v-if="previewIndex !== null" class="preview-overlay" @click.self="previewIndex = null">
      <button class="preview-close" @click="previewIndex = null">✕</button>
      <button class="preview-prev" @click="prevPhoto">‹</button>
      <img :src="diary.photos[previewIndex]" class="preview-img" />
      <button class="preview-next" @click="nextPhoto">›</button>
      <div class="preview-counter">{{ previewIndex + 1 }} / {{ diary.photos.length }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDiary, updateDiary, deleteDiary } from '../api'

const route = useRoute()
const router = useRouter()
const diary = ref(null)
const loading = ref(true)

// 编辑状态
const editing = ref(false)
const editTitle = ref('')
const editContent = ref('')
const editMood = ref('')
const saving = ref(false)

// 照片预览
const previewIndex = ref(null)

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

function getMoodLabel(mood) {
  const found = moods.find(m => m.value === mood)
  return found ? found.label : ''
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

onMounted(async () => {
  try {
    const id = route.params.id
    diary.value = await getDiary(id)
  } catch (e) {
    console.error('加载日记详情失败:', e)
  } finally {
    loading.value = false
  }
})

function cancelEdit() {
  editing.value = false
  editTitle.value = ''
  editContent.value = ''
  editMood.value = ''
}

async function saveEdit() {
  if (!editTitle.value.trim() || !editContent.value.trim()) {
    alert('标题和内容不能为空')
    return
  }
  saving.value = true
  try {
    const updated = await updateDiary(diary.value.id, {
      title: editTitle.value.trim(),
      content: editContent.value.trim(),
      mood: editMood.value,
    })
    diary.value = { ...diary.value, ...updated }
    editing.value = false
  } catch (e) {
    console.error('保存失败:', e)
    alert('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!confirm('确定要删除这篇日记吗？')) return
  try {
    await deleteDiary(diary.value.id)
    router.push('/diaries')
  } catch (e) {
    console.error('删除失败:', e)
    alert('删除失败，请重试')
  }
}

function openPreview(i) {
  previewIndex.value = i
}
function prevPhoto() {
  if (!diary.value?.photos) return
  previewIndex.value = (previewIndex.value - 1 + diary.value.photos.length) % diary.value.photos.length
}
function nextPhoto() {
  if (!diary.value?.photos) return
  previewIndex.value = (previewIndex.value + 1) % diary.value.photos.length
}
</script>

<style scoped>
.diary-detail {
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
.empty {
  text-align: center;
  color: #999;
  padding: 80px 20px;
}
.detail-content { padding: 20px 16px; }
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.mood-emoji { font-size: 36px; }
.header-info { flex: 1; }
.detail-date { font-size: 14px; color: #666; }
.mood-label { font-size: 12px; color: #999; }
.header-actions { display: flex; gap: 8px; }
.btn-edit, .btn-del {
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}
.btn-edit { background: #f0edff; color: #6c5ce7; }
.btn-del { background: #fff0f0; color: #e74c3c; }

.detail-title {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
}
.detail-body {
  font-size: 15px;
  color: #555;
  line-height: 1.8;
  white-space: pre-wrap;
  margin-bottom: 16px;
}
.detail-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}
.idol-tag {
  background: #f0edff;
  color: #6c5ce7;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 10px;
}
.event-tag {
  background: #fff3e0;
  color: #e67e22;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 10px;
}

/* 照片画廊 */
.gallery { margin-top: 16px; }
.gallery-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.gallery-photo {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 10px;
  cursor: pointer;
}

/* 编辑 */
.edit-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 600;
  box-sizing: border-box;
  margin-bottom: 12px;
}
.edit-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 15px;
  box-sizing: border-box;
  font-family: inherit;
  resize: vertical;
  line-height: 1.6;
  margin-bottom: 16px;
}
.edit-section { margin-bottom: 16px; }
.label { font-size: 13px; color: #666; margin-bottom: 8px; }
.mood-grid { display: flex; gap: 8px; flex-wrap: wrap; }
.mood-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 10px;
  border: 2px solid #eee;
  border-radius: 10px;
  cursor: pointer;
  min-width: 50px;
  transition: all 0.2s;
}
.mood-item.active { border-color: #6c5ce7; background: #f8f5ff; }
.mood-emoji-sm { font-size: 20px; }
.mood-label-sm { font-size: 10px; color: #999; margin-top: 2px; }
.edit-actions {
  display: flex;
  gap: 12px;
}
.btn-cancel, .btn-save {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  cursor: pointer;
}
.btn-cancel { background: #eee; color: #666; }
.btn-save { background: #6c5ce7; color: #fff; }
.btn-save:disabled { opacity: 0.5; }

/* 照片预览 */
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.9);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: #fff;
  font-size: 28px;
  cursor: pointer;
  z-index: 10;
}
.preview-prev, .preview-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  font-size: 36px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  z-index: 10;
}
.preview-prev { left: 12px; }
.preview-next { right: 12px; }
.preview-img {
  max-width: 90vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
}
.preview-counter {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255,255,255,0.7);
  font-size: 14px;
}
</style>
