import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminAuthService } from "@/services/auth.service";
import type { AdminUser } from "@/types/api";

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be inside AdminAuthProvider");
  return ctx;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Validate existing token on mount
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("talentradar_admin_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const adminData = await adminAuthService.getMe();
        setAdmin(adminData);
      } catch (error) {
        // Token is invalid, clear it
        localStorage.removeItem("talentradar_admin_token");
        setAdmin(null);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await adminAuthService.login(email, password);
    localStorage.setItem("talentradar_admin_token", response.token);
    setAdmin(response.admin);
    navigate("/admin");
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem("talentradar_admin_token");
    setAdmin(null);
    navigate("/admin/login");
  }, [navigate]);

  const isAuthenticated = !!admin;

  return (
    <AdminAuthContext.Provider value={{ admin, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
