<template>
  <div class="idols-page">
    <header class="page-header">
      <h1>⭐ 我的偶像</h1>
    </header>
    <div class="idol-list">
      <div v-if="loading" class="empty">加载中…</div>
      <div v-else-if="idols.length === 0" class="empty">还没有偶像，点击下方按钮添加 ✨</div>
      <div v-for="idol in idols" :key="idol.id" class="idol-card">
        <img :src="idol.avatar" :alt="idol.name" class="idol-avatar" />
        <div class="idol-name">{{ idol.name }}</div>
        <div class="idol-actions">
          <button class="btn-edit" @click="editIdol(idol)">编辑</button>
          <button class="btn-del" @click="deleteIdol(idol)">删除</button>
        </div>
      </div>
    </div>
    <router-link to="/add-idol" class="fab">＋</router-link>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getIdols, deleteIdol as apiDeleteIdol } from '../api'

const idols = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    idols.value = await getIdols()
  } catch (e) {
    console.error('加载偶像列表失败:', e)
  } finally {
    loading.value = false
  }
})

async function deleteIdol(idol) {
  if (!confirm(`确定要删除「${idol.name}」吗？关联的行程也会被删除。`)) return
  try {
    await apiDeleteIdol(idol.id)
    idols.value = idols.value.filter(i => i.id !== idol.id)
  } catch (e) {
    console.error('删除失败:', e)
    alert('删除失败，请重试')
  }
}

function editIdol(idol) {
  const newName = prompt('修改偶像名称:', idol.name)
  if (newName && newName.trim() && newName !== idol.name) {
    import('../api').then(({ updateIdol }) => {
      updateIdol(idol.id, { name: newName.trim(), avatar: idol.avatar }).then(updated => {
        const idx = idols.value.findIndex(i => i.id === idol.id)
        if (idx !== -1) idols.value[idx] = updated
      }).catch(e => {
        console.error('更新失败:', e)
        alert('更新失败，请重试')
      })
    })
  }
}
</script>

<style scoped>
.idols-page {
  padding-bottom: 80px;
  min-height: 100vh;
  background: #f8f9fa;
}
.page-header {
  padding: 20px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.page-header h1 { margin: 0; font-size: 20px; }
.idol-list { padding: 16px; }
.idol-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.idol-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 14px;
}
.idol-name { flex: 1; font-size: 16px; font-weight: 600; }
.idol-actions { display: flex; gap: 8px; }
.btn-edit, .btn-del {
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}
.btn-edit { background: #f0edff; color: #6c5ce7; }
.btn-del { background: #fff0f0; color: #e74c3c; }
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
