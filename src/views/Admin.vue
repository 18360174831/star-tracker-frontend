<template>
  <div class="admin-page">
    <header class="page-header">
      <h1>🛠️ 管理后台</h1>
      <div class="header-info">
        <span class="admin-badge">Admin</span>
      </div>
    </header>

    <div class="user-list">
      <div v-if="loading" class="empty">加载中…</div>
      <div v-else-if="users.length === 0" class="empty">暂无用户数据</div>

      <div v-for="user in users" :key="user.id" class="user-card">
        <div class="user-info">
          <div class="user-avatar">{{ (user.nickname || user.username || '?')[0].toUpperCase() }}</div>
          <div class="user-detail">
            <div class="user-name">
              {{ user.username }}
              <span v-if="user.role === 'admin'" class="role-tag admin">管理员</span>
              <span v-else class="role-tag">用户</span>
            </div>
            <div class="user-meta">
              ID: {{ user.id }} · 昵称: {{ user.nickname || '-' }}
            </div>
            <div class="user-meta">
              注册: {{ formatDate(user.created_at || user.createdAt) }}
            </div>
          </div>
        </div>
        <div class="user-stats">
          <div class="stat-item">
            <span class="stat-value">{{ user.stats?.idols || 0 }}</span>
            <span class="stat-label">偶像</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ user.stats?.events || 0 }}</span>
            <span class="stat-label">行程</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ user.stats?.diaries || 0 }}</span>
            <span class="stat-label">日记</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ user.stats?.estimatedMemory || '0B' }}</span>
            <span class="stat-label">存储</span>
          </div>
        </div>
        <div class="user-actions" v-if="user.role !== 'admin'">
          <button class="btn-del" @click="handleDelete(user)">删除用户</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUsers, deleteUser } from '../api'

const users = ref([])
const loading = ref(true)

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

async function loadUsers() {
  loading.value = true
  try {
    users.value = await getUsers()
  } catch (e) {
    console.error('加载用户列表失败:', e)
    if (e.response?.status === 403) {
      alert('无权限访问，需要管理员账号')
    }
  } finally {
    loading.value = false
  }
}

async function handleDelete(user) {
  if (!confirm(`确定要删除用户「${user.username}」吗？\n该操作将删除该用户的所有数据（偶像、行程、日记），不可恢复！`)) return
  try {
    await deleteUser(user.id)
    users.value = users.value.filter(u => u.id !== user.id)
    alert(`用户「${user.username}」已删除`)
  } catch (e) {
    console.error('删除失败:', e)
    alert('删除失败，请重试')
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 80px;
}
.page-header {
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-header h1 { margin: 0; font-size: 20px; }
.admin-badge {
  background: #e74c3c;
  color: #fff;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 10px;
  font-weight: 600;
}
.user-list { padding: 12px 16px; }
.user-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #6c5ce7;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
}
.user-detail { flex: 1; }
.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}
.role-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 8px;
  background: #eee;
  color: #999;
}
.role-tag.admin {
  background: #ffeaea;
  color: #e74c3c;
}
.user-meta {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
.user-stats {
  display: flex;
  gap: 0;
  margin-bottom: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 10px;
}
.stat-item {
  flex: 1;
  text-align: center;
}
.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #6c5ce7;
}
.stat-label {
  font-size: 11px;
  color: #999;
}
.user-actions {
  display: flex;
  justify-content: flex-end;
}
.btn-del {
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  background: #fff0f0;
  color: #e74c3c;
}
.btn-del:active { background: #ffe0e0; }
.empty {
  text-align: center;
  color: #999;
  padding: 60px 20px;
}
</style>
