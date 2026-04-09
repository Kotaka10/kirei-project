import { Link, Outlet } from "react-router-dom";

export default function ColoredLayout() {
  return (
    <div className="min-h-screen bg-slate-100">
       <nav className="flex items-center justify-center gap-4">
        <Link to="/register">会社登録ページ</Link>
        <Link to="/list">会社一覧</Link>
        <Link to="/user-register">ユーザー登録ページ</Link>
        <Link to="/item-register">商品登録ページ</Link>
        <Link to="/uploads">ファイルアップロード</Link>
        <Link to="/upload-blob">テキスト Blob</Link>
        <Link to="/picture-blob">画像 Blob</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}