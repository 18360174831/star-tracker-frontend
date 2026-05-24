<template>
  <div class="admin-login-page">
    <div class="admin-login-card">
      <div class="admin-login-header">
        <div class="admin-icon">🛠️</div>
        <h1>管理员登录</h1>
        <p>此入口仅供管理员使用</p>
      </div>

      <form class="admin-login-form" @submit.prevent="handleLogin">
        <label class="field">
          <span class="label">管理员账号</span>
          <input v-model="username" type="text" placeholder="输入管理员用户名" required autocomplete="username" />
        </label>

        <label class="field">
          <span class="label">密码</span>
          <div class="password-wrapper">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="输入密码"
              required
              autocomplete="current-password"
            />
            <button type="button" class="pwd-toggle" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </label>

        <button type="submit" class="submit-btn" :disabled="submitting">
          {{ submitting ? '登录中…' : '管理员登录' }}
        </button>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      </form>

      <div class="admin-login-footer">
        <router-link to="/login" class="back-link">← 返回普通登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api'

const router = useRouter()
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  if (submitting.value) return
  errorMsg.value = ''
  submitting.value = true

  try {
    const result = await login(username.value, password.value)

    // 检查是否是管理员
    if (result.user?.role !== 'admin') {
      errorMsg.value = '该账号不是管理员，无法从此入口登录'
      submitting.value = false
      return
    }

    // 保存 token 和用户信息
    localStorage.setItem('token', result.token)
    localStorage.setItem('user', JSON.stringify(result.user))

    // 更新 axios 默认 header
    const { default: api } = await import('../api')
    api.defaults.headers.common['Authorization'] = `Bearer ${result.token}`

    router.push('/admin')
  } catch (e) {
    if (e.response?.status === 401) {
      errorMsg.value = '用户名或密码错误'
    } else if (e.response?.data?.error) {
      errorMsg.value = e.response.data.error
    } else {
      errorMsg.value = '登录失败，请重试'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #2d3436 0%, #636e72 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.admin-login-card {
  background: #fff;
  border-radius: 20px;
  padding: 32px 24px;
  max-width: 380px;
  width: 100%;
  box-shadow: 0 8px 30px rgba(0,0,0,0.3);
}
.admin-login-header {
  text-align: center;
  margin-bottom: 28px;
}
.admin-icon {
  font-size: 40px;
  margin-bottom: 8px;
}
.admin-login-header h1 {
  margin: 0;
  font-size: 22px;
  color: #333;
}
.admin-login-header p {
  margin: 6px 0 0;
  font-size: 13px;
  color: #999;
}
.admin-login-form { margin-bottom: 16px; }
.field { display: block; margin-bottom: 18px; }
.label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}
.field input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 15px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.field input:focus {
  outline: none;
  border-color: #e74c3c;
}
.password-wrapper {
  position: relative;
}
.password-wrapper input {
  padding-right: 44px;
}
.pwd-toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}
.submit-btn {
  width: 100%;
  padding: 14px;
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
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
.admin-login-footer {
  text-align: center;
}
.back-link {
  color: #999;
  font-size: 13px;
  text-decoration: none;
}
.back-link:hover { color: #6c5ce7; }
</style>
