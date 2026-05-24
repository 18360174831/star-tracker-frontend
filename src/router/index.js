import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Auth', component: () => import('../views/Auth.vue'), meta: { guest: true } },
  { path: '/admin_logic', name: 'AdminLogin', component: () => import('../views/AdminLogin.vue'), meta: { guest: true } },
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/idols', name: 'Idols', component: () => import('../views/Idols.vue') },
  { path: '/add-idol', name: 'AddIdol', component: () => import('../views/AddIdol.vue') },
  { path: '/add-event', name: 'AddEvent', component: () => import('../views/AddEvent.vue') },
  { path: '/map', name: 'Map', component: () => import('../views/MapView.vue') },
  { path: '/diaries', name: 'Diaries', component: () => import('../views/Diaries.vue') },
  { path: '/add-diary', name: 'AddDiary', component: () => import('../views/AddDiary.vue') },
  { path: '/diary/:id', name: 'DiaryDetail', component: () => import('../views/DiaryDetail.vue') },
  { path: '/change-password', name: 'ChangePassword', component: () => import('../views/ChangePassword.vue') },
  { path: '/admin', name: 'Admin', component: () => import('../views/Admin.vue'), meta: { requiresAdmin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  // 登录页：已登录跳首页，未登录放行
  if (to.meta.guest) {
    if (token) {
      next('/')
    } else {
      next()
    }
    return
  }

  // 未登录：跳登录页
  if (!token) {
    next('/login')
    return
  }

  // Admin 页面：检查角色
  if (to.meta.requiresAdmin) {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      if (user?.role === 'admin') {
        next()
      } else {
        alert('需要管理员权限')
        next('/')
      }
    } catch {
      next('/')
    }
    return
  }

  next()
})

export default router
