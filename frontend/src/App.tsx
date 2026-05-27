import './App.css'
import { Routes, Route } from 'react-router-dom';
import RegisterForm from "./features/company/components/CompanyRegister";
import CompanyList from './features/company/components/CompanyList';
import CompanyEdit from './features/company/components/CompanyEdit';
import UserRegister from './features/user/components/UserRegister';
import ItemRegister from './features/item/components/ItemRegister';
import ItemList from './features/item/components/ItemList';
import DefaultLayout from './features/layout/DefaultLayout';
import ItemEdit from './features/item/components/ItemEdit';
import FileUploadPage from './features/files/components/FileUploadPage';
import FileUploadByBlob from './features/files/components/FileUploadByBlob';
import UploadByBlob from './features/practice/UploadByBlob';
import Chat from './features/chat/Chat';
import LoginPage from './features/auth/components/LoginPage';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import { useAuth } from './features/auth/context/AuthContext';
import { ChatWidget } from './features/ai/components/chat/ChatWidget';
import StaffSkillPage from './features/staff-skills/components/StaffSkillPage';
import JobListPage from './features/jobs/components/JobListPage';
import ApprovalPage from './features/approvals/components/ApprovalPage';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DefaultLayout />}>
            <Route path="/register"          element={<RegisterForm />} />
            <Route path="/list"              element={<CompanyList />} />
            <Route path="/company/edit/:id"  element={<CompanyEdit />} />
            <Route path="/user-register"     element={<UserRegister />} />
            <Route path="/item-register"     element={<ItemRegister />} />
            <Route path="/item-list"         element={<ItemList />} />
            <Route path="/item-edit/:id"     element={<ItemEdit />} />
            <Route path="/uploads"           element={<FileUploadPage />} />
            <Route path="/upload-blob"       element={<FileUploadByBlob />} />
            <Route path="/picture-blob"      element={<UploadByBlob />} />
            <Route path="/messages"          element={<Chat />} />
            <Route path="/staff-skills"      element={<StaffSkillPage />} />
            <Route path="/jobs"              element={<JobListPage />} />
            <Route path="/approvals"         element={<ApprovalPage />} />
          </Route>
        </Route>
      </Routes>

      {isAuthenticated && <ChatWidget />}
    </>
  );
}

export default App;
