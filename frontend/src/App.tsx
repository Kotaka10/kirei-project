import './App.css'
import RegisterForm from "./features/register/components/RegisterForm";
import CompanyList from './features/list/CompanyList';
import CompanyEdit from './features/edit/CompanyEdit';
import { Routes, Route, Link } from 'react-router-dom';

function App() {
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-sky-100 to-cyan-100">
      <nav className="flex items-center justify-center gap-4">
        <Link to="/">ホーム</Link>
        <Link to="/register">登録画面</Link>
        <Link to="/list">会社一覧</Link>
      </nav>
      <Routes>
        <Route path="/" />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/list" element={<CompanyList />} />
        <Route path="/company/edit/:id" element={<CompanyEdit />} />
      </Routes>
    </div>
  )
}

export default App
