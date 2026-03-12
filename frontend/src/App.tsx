import './App.css'
import RegisterForm from "./features/register/RegisterForm";
import CompanyList from './features/list/CompanyList';
import CompanyEdit from './features/edit/CompanyEdit';
import { Routes, Route } from 'react-router-dom';
import UserRegister from './features/register/UserRegister';
import ItemRegister from './features/register/ItemRegister';
import ItemList from './features/register/components/ItemList';
import DefaultLayout from './features/layout/DefaultLayout';
import ColoredLayout from './features/layout/ColoredLayout';

function App() {
  
  return (
    <Routes>
      <Route element={<DefaultLayout />}>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/list" element={<CompanyList />} />
        <Route path="/company/edit/:id" element={<CompanyEdit />} />
        <Route path="/item-list" element={<ItemList />} />
      </Route>
      <Route element={<ColoredLayout />}>
        <Route path="/user-register" element={<UserRegister />} />
        <Route path="/item-register" element={<ItemRegister />} />
      </Route>
    </Routes>
  )
}

export default App
