import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthUser } from "../types/authTypes";
import { clearOneSignalUser, setupOneSignalUser } from "../../../one-signal/lib/onesignal";

const TOKEN_KEY = "auth_token";
const USER_KEY  = "auth_user";

interface AuthContextValue {
    token:           string | null;
    user:            AuthUser | null;
    isAuthenticated: boolean;
    saveAuth:        (token: string, user: AuthUser) => void;
    logout:          () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [user,  setUser]  = useState<AuthUser | null>(() => {
        try {
            const raw = localStorage.getItem(USER_KEY);
            return raw ? (JSON.parse(raw) as AuthUser) : null;
        } catch {
            return null;
        }
    });

    const saveAuth = (newToken: string, newUser: AuthUser) => {
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY,  JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);

        void setupOneSignalUser(newUser.staff_id, { requestPermission: true }).catch(error => {
            console.warn("[OneSignal] setup failed after login", error);
        });
    };

    const logout = () => {
        void clearOneSignalUser().catch(error => {
            console.warn("[OneSignal] logout failed", error);
        });
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
    };

    useEffect(() => {
        if (!user?.staff_id) return;
        // 初回ログイン時の許可リクエストは saveAuth 側が担当する。
        // 許可前にここが走ると購読が無い状態で login() してしまい external_id が
        // 購読に紐付かないため、すでに許可済みのとき（再訪問時）だけ紐付け直す。
        if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

        void setupOneSignalUser(user.staff_id).catch(error => {
            console.warn("[OneSignal] setup failed", error);
        });
    }, [user?.staff_id]);

    return (
        <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, saveAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth は AuthProvider 内で使用してください");
    return ctx;
}
