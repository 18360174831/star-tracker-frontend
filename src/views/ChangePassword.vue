<template>
  <div class="change-pwd-page">
    <header class="page-header">
      <router-link to="/" class="back">← 返回</router-link>
      <h1>修改密码</h1>
    </header>

    <form class="form" @submit.prevent="handleSubmit">
      <label class="field">
        <span class="label">当前密码</span>
        <input v-model="oldPassword" type="password" placeholder="输入当前密码" required />
      </label>

      <label class="field">
        <span class="label">新密码</span>
        <input v-model="newPassword" type="password" placeholder="至少8位" required minlength="8" />
      </label>

      <label class="field">
        <span class="label">确认新密码</span>
        <input v-model="confirmPassword" type="password" placeholder="再次输入新密码" required />
      </label>

      <button type="submit" class="submit-btn" :disabled="submitting">
        {{ submitting ? '修改中…' : '确认修改' }}
      </button>

      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { changePassword, logout } from '../api'

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

async function handleSubmit() {
  errorMsg.value = ''
  successMsg.value = ''

  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = '两次输入的新密码不一致'
    return
  }
  if (newPassword.value.length < 8) {
    errorMsg.value = '新密码至少8位'
    return
  }

  submitting.value = true
  try {
    await changePassword({
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
    })
    successMsg.value = '密码修改成功，即将退出重新登录…'
    setTimeout(() => {
      logout()
    }, 1500)
  } catch (e) {
    if (e.response?.data?.error) {
      errorMsg.value = e.response.data.error
    } else {
      errorMsg.value = '修改失败，请重试'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.change-pwd-page {
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
.field input:focus { outline: none; border-color: #6c5ce7; }
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
.error-msg {
  margin-top: 12px;
  padding: 10px 14px;
  background: #fff0f0;
  color: #e74c3c;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
}
.success-msg {
  margin-top: 12px;
  padding: 10px 14px;
  background: #f0fff0;
  color: #27ae60;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
}
</style>
