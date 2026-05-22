import { createContext, useContext, useState, type ReactNode } from "react";
import type { AuthUser } from "../types/authTypes";

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
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
    };

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
