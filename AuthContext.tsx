import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Role = "admin" | "faculty";

export interface AuthUser {
  email: string;
  role: Role;
  name: string;
  token?: string;
}

export interface LoginLogEntry {
  id: string;
  email: string;
  role: Role;
  timestamp: string;
  status: "SUCCESS" | "FAILED";
  device: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loginLogs: LoginLogEntry[];
  login: (email: string, role: Role, name?: string, token?: string) => void;
  logout: () => void;
  clearLogs: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INITIAL_LOGS: LoginLogEntry[] = [
  {
    id: "log-1",
    email: "admin@icfai.edu",
    role: "admin",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toLocaleString(),
    status: "SUCCESS",
    device: "Chrome / Windows 11",
  },
  {
    id: "log-2",
    email: "faculty@icfai.edu",
    role: "faculty",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toLocaleString(),
    status: "SUCCESS",
    device: "Firefox / macOS",
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("icfai_user");
    return saved ? JSON.parse(saved) : { email: "admin@icfai.edu", role: "admin", name: "Super Admin" };
  });

  const [loginLogs, setLoginLogs] = useState<LoginLogEntry[]>(() => {
    const saved = localStorage.getItem("icfai_login_logs");
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("icfai_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("icfai_user");
      localStorage.removeItem("icfai_jwt_token");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("icfai_login_logs", JSON.stringify(loginLogs));
  }, [loginLogs]);

  const login = (email: string, role: Role, name?: string, token?: string) => {
    const roleTitle = name || (role === "admin" ? "Super Admin" : "Faculty Member");
    const loggedUser: AuthUser = {
      email: email || `${role}@icfai.edu`,
      role,
      name: roleTitle,
      token,
    };
    if (token) {
      localStorage.setItem("icfai_jwt_token", token);
    }
    setUser(loggedUser);

    // Record login entry in audit log
    const newLog: LoginLogEntry = {
      id: `log-${Date.now()}`,
      email: loggedUser.email,
      role: loggedUser.role,
      timestamp: new Date().toLocaleString(),
      status: "SUCCESS",
      device: navigator.userAgent.includes("Windows") ? "Chrome / Windows" : "Web Browser",
    };

    setLoginLogs((prev) => [newLog, ...prev]);
  };

  const logout = () => {
    setUser(null);
  };

  const clearLogs = () => {
    setLoginLogs([]);
    localStorage.removeItem("icfai_login_logs");
  };

  return (
    <AuthContext.Provider value={{ user, loginLogs, login, logout, clearLogs }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
