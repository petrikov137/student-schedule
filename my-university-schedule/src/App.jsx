import { HashRouter, Routes, Route } from 'react-router-dom'
import StudentView from './Schedule/StudentView';
import Admin from './Admin'
import Login from './Login' // 🌟 استيراد صفحة الدخول

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
    </HashRouter>
  )
}

export default App