import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth.service";
import type { Company } from "@/types/api";

interface RegisterData {
  name: string;
  email: string;
  password: string;
  size: string;
  monthlyRevenue: string;
}

interface AuthContextType {
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Validate existing token on mount
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("talentradar_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const companyData = await authService.getMe();
        setCompany(companyData);
      } catch (error) {
        // Token is invalid, clear it
        localStorage.removeItem("talentradar_token");
        setCompany(null);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login(email, password);
    localStorage.setItem("talentradar_token", response.token);
    setCompany(response.company);
    navigate("/dashboard");
  }, [navigate]);

  const register = useCallback(async (data: RegisterData) => {
    const response = await authService.register(data);
    localStorage.setItem("talentradar_token", response.token);
    setCompany(response.company);
    navigate("/dashboard");
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem("talentradar_token");
    setCompany(null);
    navigate("/login");
  }, [navigate]);

  const isAuthenticated = !!company;

  return (
    <AuthContext.Provider value={{ company, isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
