<template>
  <div class="add-idol">
    <header class="page-header">
      <router-link to="/idols" class="back">← 返回</router-link>
      <h1>添加偶像</h1>
    </header>
    <form class="form" @submit.prevent="submit">
      <div class="avatar-upload" @click="pickAvatar">
        <img v-if="avatarPreview" :src="avatarPreview" class="avatar-preview" />
        <div v-else class="avatar-placeholder">📷<br/>点击上传头像</div>
      </div>
      <input type="file" ref="fileInput" accept="image/*" hidden @change="onFileChange" />

      <label class="field">
        <span class="label">偶像名称</span>
        <input v-model="name" type="text" placeholder="输入偶像名字" required />
      </label>

      <button type="submit" class="submit-btn" :disabled="!name.trim() || submitting">
        {{ submitting ? '保存中…' : '保存' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createIdol, uploadImage } from '../api'

const router = useRouter()
const name = ref('')
const avatarPreview = ref('')
const avatarFile = ref(null)
const fileInput = ref(null)
const submitting = ref(false)

function pickAvatar() {
  fileInput.value.click()
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) {
    avatarFile.value = file
    avatarPreview.value = URL.createObjectURL(file)
  }
}

async function submit() {
  if (!name.value.trim() || submitting.value) return
  submitting.value = true
  try {
    let avatarUrl = ''
    if (avatarFile.value) {
      const result = await uploadImage(avatarFile.value)
      avatarUrl = result.url
    }
    await createIdol({ name: name.value.trim(), avatar: avatarUrl })
    router.push('/idols')
  } catch (e) {
    console.error('保存偶像失败:', e)
    alert('保存失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.add-idol {
  min-height: 100vh;
  background: #f8f9fa;
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
.form { padding: 24px 16px; }
.avatar-upload {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #fff;
  border: 2px dashed #ddd;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
}
.avatar-preview { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { text-align: center; font-size: 12px; color: #999; }
.field { display: block; margin-bottom: 20px; }
.label { display: block; font-size: 13px; color: #666; margin-bottom: 6px; }
.field input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 15px;
  box-sizing: border-box;
}
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
