import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginApi } from "../lib/api";
import { LoginRequestSchema } from "../types/authTypes";

export default function LoginPage() {
    const navigate               = useNavigate();
    const { saveAuth }           = useAuth();
    const [email,     setEmail]     = useState("");
    const [password,  setPassword]  = useState("");
    const [error,     setError]     = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const parsed = LoginRequestSchema.safeParse({ email, password });
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "入力が不正です");
            return;
        }

        setIsLoading(true);
        try {
            const result = await loginApi(parsed.data);
            saveAuth(result.token, result.user);
            navigate("/list", { replace: true });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "ログインに失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
                <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">ログイン</h1>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            メールアドレス
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@company.com"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            パスワード
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="6文字以上"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? "ログイン中..." : "ログイン"}
                    </button>
                </form>
            </div>
        </div>
    );
}
