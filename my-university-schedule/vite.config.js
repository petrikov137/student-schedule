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
        name: 'Versa Schedule',
        short_name: 'Versa',
        description: 'جدول المحاضرات الجامعي',
        theme_color: '#0f2027', // لون شريط الهاتف من الأعلى
        background_color: '#0f2027', // لون شاشة التحميل
        display: 'standalone', // جعله يفتح كتطبيق مستقل بدون شريط المتصفح
        start_url: '/', // الرابط الذي سيفتح عليه التطبيق


        // ... 
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // مهم جداً لكي يأخذ شكل الأيقونة الدائري أو المربع حسب نوع الهاتف
          }
        ]
      
      }
    })
  ],
  base: '/',
  
  // 🌟(localtunnel) 🌟
  server: {
    allowedHosts: [
      '.loca.lt' // يسمح لأي رابط ينتهي بـ loca.lt لتجنب تعديله في كل مرة يتغير فيها الرابط
    ]
  }
})