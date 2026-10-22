
import { HashRouter, Routes, Route } from 'react-router-dom'
import StudentView from './Schedule/StudentView';
import Admin from './Admin'
import Login from './Login' // 🌟 استيراد صفحة الدخول (يمكنك تركها إن كانت موجودة كمكون، حتى لو حذفت الرابط)
import InstallPrompt from './InstallPrompt' // 🌟 استدعاء النافذة الذكية 🌟

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* رابط صفحة تسجيل الدخول */}
        <Route path="/login" element={<Login />} />

        {/* الرابط الرئيسي لصفحة الجدول */}
        <Route path="/" element={<StudentView />} />
        
        {/* رابط صفحة الأدمن */}
        <Route path="/admin" element={<Admin />} />
      </Routes>

      {/* 🌟 تشغيل نافذة التثبيت لتظهر فوق كل الصفحات 🌟 */}
      <InstallPrompt />

    </HashRouter>
  )
}

export default App

