// 2jsx;s
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import StudentView from './StudentView'
import Admin from './Admin'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentView />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App