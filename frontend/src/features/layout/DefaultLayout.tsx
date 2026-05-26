import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../auth/context/AuthContext";
import { usePendingCount } from "../approvals/hooks/useApprovals";

export default function DefaultLayout() {
  const { user }       = useAuth();
  const pendingCount   = usePendingCount();
  const isSupervisor   = user?.role === "supervisor";

  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-center gap-4 flex-wrap py-2 border-b">
        <Link to="/register">会社登録ページ</Link>
        <Link to="/list">会社一覧</Link>
        <Link to="/user-register">ユーザー登録ページ</Link>
        <Link to="/item-register">商品登録ページ</Link>
        <Link to="/uploads">ファイルアップロード</Link>
        <Link to="/upload-blob">テキスト Blob</Link>
        <Link to="/picture-blob">画像 Blob</Link>
        <Link to="/messages">チャット</Link>
        <Link to="/staff-skills">スキル管理</Link>
        <Link to="/jobs">ジョブ一覧</Link>
        {isSupervisor && (
          <Link to="/approvals" className="relative inline-flex items-center gap-1">
            承認管理
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </Link>
        )}
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}