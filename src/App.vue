<template>
  <div class="app">
    <router-view />
    
    <!-- 顶部右上角头像按钮（非登录页） -->
    <div v-if="!$route.meta.guest" class="top-avatar-btn" @click="showProfile = !showProfile">
      <div class="avatar-circle">{{ userInitial }}</div>
    </div>

    <nav class="tabbar" v-if="!$route.meta.guest">
      <router-link to="/" class="tab" :class="{ active: $route.path === '/' }">
        <span class="tab-icon">🏠</span>
        <span class="tab-label">首页</span>
      </router-link>
      <router-link to="/idols" class="tab" :class="{ active: $route.path === '/idols' }">
        <span class="tab-icon">⭐</span>
        <span class="tab-label">偶像</span>
      </router-link>
      <router-link to="/map" class="tab" :class="{ active: $route.path === '/map' }">
        <span class="tab-icon">🗺️</span>
        <span class="tab-label">地图</span>
      </router-link>
      <router-link to="/diaries" class="tab" :class="{ active: $route.path.startsWith('/diaries') || $route.path.startsWith('/diary') || $route.path === '/add-diary' }">
        <span class="tab-icon">📝</span>
        <span class="tab-label">日记</span>
      </router-link>
    </nav>

    <!-- 个人中心面板（右侧滑出） -->
    <div v-if="showProfile" class="profile-overlay" @click.self="showProfile = false">
      <div class="profile-panel" @click.stop>
        <div class="profile-header">
          <button class="profile-close" @click="showProfile = false">✕</button>
          <div class="profile-avatar-wrapper" @click="pickAvatar">
            <div class="profile-avatar" v-if="!profileForm.avatar">{{ userInitial }}</div>
            <img v-else :src="profileForm.avatar" class="profile-avatar-img" />
            <div class="avatar-edit-hint">📷</div>
          </div>
          <input type="file" ref="avatarInput" accept="image/*" hidden @change="onAvatarChange" />
          <div class="profile-role">{{ currentUser?.role === 'admin' ? '管理员' : '普通用户' }}</div>
        </div>

        <div class="profile-body">
          <!-- 昵称 -->
          <div class="profile-field">
            <label class="pf-label">昵称</label>
            <div class="pf-input-row">
              <input v-model="profileForm.nickname" type="text" placeholder="输入昵称" class="pf-input" />
            </div>
          </div>

          <!-- 个性签名 -->
          <div class="profile-field">
            <label class="pf-label">个性签名</label>
            <div class="pf-input-row">
              <textarea v-model="profileForm.bio" placeholder="写一句个性签名吧…" class="pf-textarea" rows="2"></textarea>
            </div>
          </div>

          <!-- 保存按钮 -->
          <button class="save-btn" @click="saveProfile" :disabled="savingProfile">
            {{ savingProfile ? '保存中…' : '保存修改' }}
          </button>

          <div class="profile-divider"></div>

          <!-- 修改密码 -->
          <router-link to="/change-password" class="profile-action" @click="showProfile = false">
            <span class="pa-icon">🔑</span>
            <span class="pa-text">修改密码</span>
            <span class="pa-arrow">›</span>
          </router-link>

          <!-- Admin 管理入口 -->
          <router-link v-if="isAdmin" to="/admin" class="profile-action" @click="showProfile = false">
            <span class="pa-icon">🛠️</span>
            <span class="pa-text">管理后台</span>
            <span class="pa-arrow">›</span>
          </router-link>

          <div class="profile-divider"></div>

          <!-- 退出登录 -->
          <div class="profile-action danger" @click="handleLogout">
            <span class="pa-icon">🚪</span>
            <span class="pa-text">退出登录</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getCurrentUser, updateProfile, uploadImage, logout } from './api'

const route = useRoute()
const showProfile = ref(false)
const avatarInput = ref(null)
const savingProfile = ref(false)

// 响应式用户数据（从 localStorage 初始化）
const currentUser = ref(getCurrentUser())
const isAdmin = computed(() => currentUser.value?.role === 'admin')
const userInitial = computed(() => {
  const name = currentUser.value?.nickname || currentUser.value?.username || '?'
  return name[0].toUpperCase()
})

// 路由变化时刷新用户数据（登录后跳转时需要）
watch(() => route.path, () => {
  const user = getCurrentUser()
  if (user) currentUser.value = user
})

const profileForm = ref({
  nickname: '',
  bio: '',
  avatar: '',
})

// 打开面板时填充表单
watch(showProfile, (val) => {
  if (val && currentUser.value) {
    profileForm.value.nickname = currentUser.value.nickname || currentUser.value.username || ''
    profileForm.value.bio = currentUser.value.bio || ''
    profileForm.value.avatar = currentUser.value.avatar || ''
  }
})

function pickAvatar() {
  avatarInput.value.click()
}

async function onAvatarChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const result = await uploadImage(file)
    profileForm.value.avatar = result.url
  } catch (err) {
    console.error('头像上传失败:', err)
    alert('头像上传失败，请重试')
  }
  e.target.value = ''
}

async function saveProfile() {
  if (savingProfile.value) return
  savingProfile.value = true
  try {
    const updated = await updateProfile({
      nickname: profileForm.value.nickname.trim(),
      bio: profileForm.value.bio.trim(),
      avatar: profileForm.value.avatar,
    })
    // 更新响应式数据和 localStorage
    const user = { ...currentUser.value, ...updated }
    localStorage.setItem('user', JSON.stringify(user))
    currentUser.value = user
    alert('保存成功')
    showProfile.value = false
  } catch (e) {
    console.error('保存失败:', e)
    alert('保存失败，请重试')
  } finally {
    savingProfile.value = false
  }
}

function handleLogout() {
  showProfile.value = false
  if (confirm('确定退出登录吗？')) {
    logout()
  }
}
</script>

<style scoped>
/* 顶部右上角头像按钮 */
.top-avatar-btn {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 90;
  cursor: pointer;
}
.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* 底部导航 */
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #fff;
  border-top: 1px solid #eee;
  padding: 8px 0;
  padding-bottom: env(safe-area-inset-bottom, 8px);
  z-index: 100;
}
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #999;
  font-size: 12px;
  transition: color 0.2s;
  cursor: pointer;
}
.tab.active, .tab.router-link-exact-active {
  color: #6c5ce7;
}
.tab-icon {
  font-size: 20px;
  margin-bottom: 2px;
}
.tab-label {
  font-size: 11px;
}

/* 个人中心面板 - 右侧滑出 */
.profile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 200;
}
.profile-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 300px;
  max-width: 85vw;
  background: #fff;
  box-shadow: -4px 0 20px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  animation: slideIn 0.2s ease-out;
}
@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.profile-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-header {
  padding: 30px 20px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  text-align: center;
  position: relative;
}
.profile-avatar-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
}
.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  margin: 0 auto;
}
.profile-avatar-img {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto;
  display: block;
}
.avatar-edit-hint {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}
.profile-role {
  color: rgba(255,255,255,0.8);
  font-size: 12px;
  margin-top: 10px;
}

.profile-body {
  padding: 16px 20px;
  flex: 1;
}
.profile-field {
  margin-bottom: 16px;
}
.pf-label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 6px;
}
.pf-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pf-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 14px;
  background: #f8f9fa;
}
.pf-input:focus {
  outline: none;
  border-color: #6c5ce7;
  background: #fff;
}
.pf-textarea {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 14px;
  background: #f8f9fa;
  resize: none;
  font-family: inherit;
  line-height: 1.4;
}
.pf-textarea:focus {
  outline: none;
  border-color: #6c5ce7;
  background: #fff;
}
.save-btn {
  width: 100%;
  padding: 10px;
  background: #6c5ce7;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 16px;
}
.save-btn:disabled { opacity: 0.5; }

.profile-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 8px 0;
}
.profile-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  font-size: 15px;
  color: #333;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.15s;
}
.profile-action:active { opacity: 0.7; }
.profile-action.danger { color: #e74c3c; }
.pa-icon { font-size: 18px; }
.pa-text { flex: 1; }
.pa-arrow { color: #ccc; font-size: 18px; }
</style>
