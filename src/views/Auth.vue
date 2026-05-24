<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <h1>⭐ 追星记录</h1>
        <p class="auth-subtitle">{{ isLogin ? '欢迎回来' : '加入我们' }}</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <label class="field">
          <span class="label">用户名</span>
          <input
            v-model="username"
            type="text"
            placeholder="2-20个字符，支持中文/英文"
            required
            minlength="2"
            maxlength="20"
            autocomplete="username"
          />
        </label>

        <label class="field">
          <span class="label">密码</span>
          <div class="password-wrapper">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="不少于8位"
              required
              minlength="8"
              autocomplete="current-password"
            />
            <button type="button" class="toggle-pwd" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </label>

        <label class="field" v-if="!isLogin">
          <span class="label">确认密码</span>
          <div class="password-wrapper">
            <input
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="再次输入密码"
              required
              minlength="8"
            />
            <button type="button" class="toggle-pwd" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </label>

        <button type="submit" class="submit-btn" :disabled="submitting">
          {{ submitting ? '处理中…' : (isLogin ? '登录' : '注册') }}
        </button>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      </form>

      <div class="auth-switch">
        <span v-if="isLogin">还没有账号？</span>
        <span v-else>已有账号？</span>
        <button class="switch-btn" @click="toggleMode">
          {{ isLogin ? '立即注册' : '去登录' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login as apiLogin, register as apiRegister } from '../api'

const router = useRouter()
const isLogin = ref(true)
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const errorMsg = ref('')

function toggleMode() {
  isLogin.value = !isLogin.value
  errorMsg.value = ''
  password.value = ''
  confirmPassword.value = ''
}

async function handleSubmit() {
  if (submitting.value) return
  errorMsg.value = ''

  // 注册时校验密码确认
  if (!isLogin.value && password.value !== confirmPassword.value) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }

  submitting.value = true

  try {
    let result
    if (isLogin.value) {
      result = await apiLogin(username.value, password.value)
    } else {
      result = await apiRegister(username.value, password.value)
    }

    localStorage.setItem('token', result.token)
    localStorage.setItem('user', JSON.stringify(result.user))

    const { default: api } = await import('../api')
    api.defaults.headers.common['Authorization'] = `Bearer ${result.token}`

    router.push('/')
  } catch (e) {
    if (e.response?.status === 409) {
      errorMsg.value = '用户名已存在，换个名字试试'
    } else if (e.response?.status === 401) {
      errorMsg.value = '用户名或密码错误'
    } else if (e.response?.data?.error) {
      errorMsg.value = e.response.data.error
    } else {
      errorMsg.value = '网络错误，请重试'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.auth-card {
  background: #fff;
  border-radius: 20px;
  padding: 32px 24px;
  max-width: 360px;
  width: 100%;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}
.auth-header {
  text-align: center;
  margin-bottom: 28px;
}
.auth-header h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}
.auth-subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  color: #999;
}
.auth-form { margin-bottom: 16px; }
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
  border-color: #6c5ce7;
}
.password-wrapper {
  position: relative;
}
.password-wrapper input {
  padding-right: 44px;
}
.toggle-pwd {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}
.submit-btn {
  width: 100%;
  padding: 14px;
  background: #6c5ce7;
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
.auth-switch {
  text-align: center;
  font-size: 14px;
  color: #999;
}
.switch-btn {
  background: none;
  border: none;
  color: #6c5ce7;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>
