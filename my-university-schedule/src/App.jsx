import { HashRouter, Routes, Route } from 'react-router-dom'
import StudentView from './StudentView'
import Admin from './Admin'

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* الرابط الرئيسي لصفحة الجدول */}
        <Route path="/" element={<StudentView />} />
        
        {/* رابط صفحة الأدمن */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </HashRouter>
  )
}

export default App