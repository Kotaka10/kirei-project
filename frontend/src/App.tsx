import './App.css'
import RegisterForm from "./features/register/components/RegisterForm";
import CompanyList from './features/list/CompanyList';
import CompanyEdit from './features/edit/CompanyEdit';
import { Routes, Route, Link } from 'react-router-dom';
import UserRegister from './features/screen/UserRegister';
import ItemRegister from './features/screen/ItemRegister';

function App() {
  
  return (
    <div className="my-2">
      <nav className="flex items-center justify-center gap-4">
        <Link to="/register">登録画面</Link>
        <Link to="/list">会社一覧</Link>
        <Link to="/user-register">ユーザー登録ページ</Link>
        <Link to="/item-register">商品登録ページ</Link>
      </nav>
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/list" element={<CompanyList />} />
        <Route path="/company/edit/:id" element={<CompanyEdit />} />
        <Route path="/user-register" element={<UserRegister />} />
        <Route path="/item-register" element={<ItemRegister />} />
      </Routes>
    </div>
  )
}

export default App
