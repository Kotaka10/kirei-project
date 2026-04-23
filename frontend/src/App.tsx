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
import useOneSignal from './one-signal/hooks/useOneSignal';

function App() {
  const {
    status,
    handleEnableNotifications
  } = useOneSignal();

  return (
    <>
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
      <div className='flex flex-col items-center justify-start p-4 gap-2'>
        <p className='text-sm text-gray-600'>状態: {status}</p>
        <button
          onClick={handleEnableNotifications}
          className='px-4 py-2 bg-blue-500 text-white rounded'
        >
          通知を有効化
        </button>
      </div>
    </>
  )
}

export default App
