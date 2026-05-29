import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/context/AuthContext";
import { usePendingCount } from "../approvals/hooks/useApprovals";

const navItem = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? "bg-blue-50 text-blue-700"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
  }`;

export default function DefaultLayout() {
  const { user, logout } = useAuth();
  const pendingCount = usePendingCount();
  const isSupervisor = user?.role === "supervisor";

  return (
    <div className="flex min-h-screen">
      {/* サイドバー */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r bg-white sticky top-0 h-screen">
        {/* ブランド */}
        <div className="px-4 py-5 border-b">
          <span className="text-lg font-bold tracking-tight text-gray-800">Kirei</span>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <NavLink to="/jobs"         className={navItem}>ジョブ一覧</NavLink>
          <NavLink to="/staff-skills" className={navItem}>スキル管理</NavLink>

          {isSupervisor && (
            <NavLink to="/approvals" className={navItem}>
              承認管理
              {pendingCount > 0 && (
                <span className="ml-auto min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </NavLink>
          )}

          {/* 会社・ユーザー管理 */}
          <div className="pt-3 mt-3 border-t space-y-0.5">
            <p className="px-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">ビジネス</p>
            <NavLink to="/register"      className={navItem}>会社登録</NavLink>
            <NavLink to="/list"          className={navItem}>会社一覧</NavLink>
            <NavLink to="/user-register" className={navItem}>ユーザー登録</NavLink>
            <NavLink to="/item-register" className={navItem}>商品登録</NavLink>
          </div>

          {/* その他 */}
          <div className="pt-3 mt-3 border-t space-y-0.5">
            <p className="px-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">その他</p>
            <NavLink to="/messages"      className={navItem}>チャット</NavLink>
            <NavLink to="/uploads"       className={navItem}>ファイルアップロード</NavLink>
            <NavLink to="/upload-blob"   className={navItem}>テキストBlobアップロード</NavLink>
            <NavLink to="/picture-blob"  className={navItem}>画像Blobアップロード</NavLink>
          </div>
        </nav>

        {/* ユーザー情報 + ログアウト */}
        {user && (
          <div className="p-4 border-t bg-gray-50 space-y-2">
            <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
            <button
              onClick={logout}
              className="w-full text-left text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              ログアウト
            </button>
          </div>
        )}
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
