import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,         //  يجعل الموقع متاحاً للشبكة
    allowedHosts: true, // يسمح بفتح الموقع من أي رابط (مثل serveo)
  },
})