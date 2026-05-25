import './App.css'
import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import RegisterForm from "./features/company/components/CompanyRegister";
import CompanyList from './features/company/components/CompanyList';
import CompanyEdit from './features/company/components/CompanyEdit';
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
import LoginPage from './features/auth/components/LoginPage';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import { useAuth } from './features/auth/context/AuthContext';
import { ChatWidget } from './features/ai/components/chat/ChatWidget';
import StaffSkillPage from './features/staff-skills/components/StaffSkillPage';
import JobListPage from './features/jobs/components/JobListPage';
import ApprovalPage from './features/approvals/components/ApprovalPage';

function App() {
  const [userId, setUserId] = useState("");
  const { status, handleEnableNotifications } = useOneSignal();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DefaultLayout />}>
            <Route path="/register"          element={<RegisterForm />} />
            <Route path="/list"              element={<CompanyList />} />
            <Route path="/company/edit/:id"  element={<CompanyEdit />} />
            <Route path="/item-list"         element={<ItemList />} />
            <Route path="/item-edit/:id"     element={<ItemEdit />} />
            <Route path="/uploads"           element={<FileUploadPage />} />
            <Route path="/messages"          element={<Chat />} />
            <Route path="/staff-skills"      element={<StaffSkillPage />} />
            <Route path="/jobs"              element={<JobListPage />} />
            <Route path="/approvals"         element={<ApprovalPage />} />
          </Route>
          <Route element={<ColoredLayout />}>
            <Route path="/user-register"  element={<UserRegister />} />
            <Route path="/item-register"  element={<ItemRegister />} />
            <Route path="/upload-blob"    element={<FileUploadByBlob />} />
            <Route path="/picture-blob"   element={<UploadByBlob />} />
          </Route>
        </Route>
      </Routes>

      {isAuthenticated && <ChatWidget />}

      {isAuthenticated && (
        <div className='flex flex-col items-center justify-start p-4 gap-2'>
          <p className='text-sm text-gray-500'>
            ログイン中: {user?.name}（{user?.role}）
          </p>
          <p className='text-sm text-gray-600 whitespace-pre-wrap'>状態: {status}</p>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="ユーザーID（例: 1）"
            className='px-3 py-2 border rounded text-sm'
          />
          <button
            type="button"
            onClick={() => { handleEnableNotifications(userId.trim()) }}
            disabled={!userId.trim()}
            className='px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50'
          >
            通知を有効化
          </button>
          <button
            type="button"
            onClick={logout}
            className='px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors'
          >
            ログアウト
          </button>
        </div>
      )}
    </>
  );
}

export default App;
