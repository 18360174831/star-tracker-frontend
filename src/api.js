import axios from 'axios'
import router from './router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '',
  timeout: 10000,
})

// 防止401重复跳转
let isRedirectingToLogin = false

// 请求拦截：自动带 token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：401 跳转登录
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && !error.config._skipAuthRedirect && !isRedirectingToLogin) {
      // 如果已经在登录页，不跳转
      if (router.currentRoute.value.path === '/login') {
        return Promise.reject(error)
      }
      isRedirectingToLogin = true
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login').finally(() => {
        // 延迟重置标志，防止短时间内再次触发
        setTimeout(() => { isRedirectingToLogin = false }, 1000)
      })
    }
    return Promise.reject(error)
  }
)

// ========== 认证 ==========
export function register(username, password) {
  return api.post('/api/auth/register', { username, password }, { _skipAuthRedirect: true }).then(r => r.data)
}

export function login(username, password) {
  return api.post('/api/auth/login', { username, password }, { _skipAuthRedirect: true }).then(r => r.data)
}

export function getMe() {
  return api.get('/api/auth/me').then(r => r.data)
}

export function updateProfile(data) {
  return api.put('/api/auth/profile', data).then(r => r.data)
}

// ========== 偶像 ==========
export function getIdols() {
  return api.get('/api/idols').then(r => r.data)
}

export function getIdol(id) {
  return api.get(`/api/idols/${id}`).then(r => r.data)
}

export function createIdol(data) {
  return api.post('/api/idols', data).then(r => r.data)
}

export function updateIdol(id, data) {
  return api.put(`/api/idols/${id}`, data).then(r => r.data)
}

export function deleteIdol(id) {
  return api.delete(`/api/idols/${id}`).then(r => r.data)
}

// ========== 行程事件 ==========
export function getEvents() {
  return api.get('/api/events').then(r => r.data)
}

export function getEvent(id) {
  return api.get(`/api/events/${id}`).then(r => r.data)
}

export function createEvent(data) {
  return api.post('/api/events', data).then(r => r.data)
}

export function updateEvent(id, data) {
  return api.put(`/api/events/${id}`, data).then(r => r.data)
}

export function deleteEvent(id) {
  return api.delete(`/api/events/${id}`).then(r => r.data)
}

// ========== 图片上传 ==========
export function uploadImage(file) {
  const formData = new FormData()
  formData.append('image', file)
  return api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

// ========== 日记 ==========
export function getDiaries(params = {}) {
  return api.get('/api/diaries', { params }).then(r => r.data)
}

export function getDiary(id) {
  return api.get(`/api/diaries/${id}`).then(r => r.data)
}

export function createDiary(data) {
  return api.post('/api/diaries', data).then(r => r.data)
}

export function updateDiary(id, data) {
  return api.put(`/api/diaries/${id}`, data).then(r => r.data)
}

export function deleteDiary(id) {
  return api.delete(`/api/diaries/${id}`).then(r => r.data)
}

// ========== Admin ==========
export function getUsers() {
  return api.get('/api/admin/users').then(r => r.data)
}

export function deleteUser(id) {
  return api.delete(`/api/admin/users/${id}`).then(r => r.data)
}

export function changePassword(data) {
  return api.put('/api/auth/password', data).then(r => r.data)
}

// ========== 场馆 ==========
export function getVenueProvinces() {
  return api.get('/api/venues/provinces').then(r => r.data)
}

export function getVenueCities(province) {
  return api.get('/api/venues/cities', { params: { province } }).then(r => r.data)
}

export function getVenueList(province, city) {
  return api.get('/api/venues/list', { params: { province, city } }).then(r => r.data)
}

export function getAllVenues() {
  return api.get('/api/venues/all').then(r => r.data)
}

export function getVisitedVenues() {
  return api.get('/api/venues/visited').then(r => r.data)
}

export function markVenueVisited(venueId) {
  return api.post('/api/venues/visited', { venueId }).then(r => r.data)
}

export function unmarkVenueVisited(id) {
  return api.delete(`/api/venues/visited/${id}`).then(r => r.data)
}

// ========== 工具函数 ==========
export function isLoggedIn() {
  return !!localStorage.getItem('token')
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user'))
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

export default api
