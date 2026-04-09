import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // تحديث تلقائي عند وجود إنترنت
      injectRegister: 'auto',
      workbox: {
        // حفظ جميع هذه الملفات لتعمل أوفلاين
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'الجدول الجامعي',
        short_name: 'Versa',
        description: 'جدول المحاضرات الجامعي الذكي',
        theme_color: '#1a1a1a', // لون شريط الهاتف من الأعلى
        background_color: '#1a1a1a', // لون شاشة التحميل
        display: 'standalone', // جعله يفتح كتطبيق مستقل بدون شريط المتصفح
        start_url: '/', // الرابط الذي سيفتح عليه التطبيق
      }
    })
  ],
  base: '/',
  
  // 🌟 هذا هو القسم الجديد للسماح بروابط النفق (localtunnel) 🌟
  server: {
    allowedHosts: [
      '.loca.lt' // يسمح لأي رابط ينتهي بـ loca.lt لتجنب تعديله في كل مرة يتغير فيها الرابط
    ]
  }
})