import './App.css'
import RegisterForm from "./features/company/components/CompanyRegister";
import CompanyList from './features/company/components/CompanyList';
import CompanyEdit from './features/company/components/CompanyEdit';
import { Routes, Route } from 'react-router-dom';
import UserRegister from './features/user/components/UserRegister';
import ItemRegister from './features/item/components/ItemRegister';
import ItemList from './features/item/components/ItemList';
import DefaultLayout from './features/layout/DefaultLayout';
import ColoredLayout from './features/layout/ColoredLayout';
import ItemEdit from './features/item/components/ItemEdit';
import FileUploadPage from './features/files/components/FileUploadPage';
import FileUploadByBlob from './features/files/components/FileUploadByBlob';
import UploadByBlob from './features/practice/UploadByBlob';
import Chat from './features/chat/Chat';

function App() {
  
  return (
    <Routes>
      <Route element={<DefaultLayout />}>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/list" element={<CompanyList />} />
        <Route path="/company/edit/:id" element={<CompanyEdit />} />
        <Route path="/item-list" element={<ItemList />} />
        <Route path="/item-edit/:id" element={<ItemEdit />} />
        <Route path="/uploads" element={<FileUploadPage />} />
        <Route path="/messages" element={<Chat />} />
      </Route>
      <Route element={<ColoredLayout />}>
        <Route path="/user-register" element={<UserRegister />} />
        <Route path="/item-register" element={<ItemRegister />} />
        <Route path="/upload-blob" element={<FileUploadByBlob />} />
        <Route path="/picture-blob" element={<UploadByBlob />} />
      </Route>
    </Routes>
  )
}

export default App
