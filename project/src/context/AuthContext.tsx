import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import axios from "../axios/axiosInstance";
import {
  getCurrentUser,
  setCurrentUser,
  getUsers,
  saveUser,
} from "../utils/storage";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isNewUser: boolean;
  clearNewUserFlag: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    // Check for existing user session on component mount
    const loggedInUser = getCurrentUser();
    if (loggedInUser) {
      setUser(loggedInUser);
      setIsAuthenticated(true);
      setIsAdmin(loggedInUser.isAdmin);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      await axios.post(
        "/api/auth/login",
        { username, password },
        { withCredentials: true }
      );
      // fetch user info
      const me = await axios.get("/api/auth/me", { withCredentials: true });
      setUser(me.data.user);
      setIsAuthenticated(true);
      setIsAdmin(me.data.user.isAdmin);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (username: string, password: string): boolean => {
    try {
      // backend will flag first user as admin
      await axios.post("/api/auth/register", { username, password });
      // momentarily treat them as new user so grid setup shows
      setIsAuthenticated(true);
      setIsNewUser(true);
      // then auto-login
      // return await login(username, password);
    } catch {
      return false;
    }

    // saveUser(newUser);

    // setCurrentUser(newUser);

    // setIsAdmin(newUser.isAdmin);
    // setIsNewUser(true);

    return true;
  };

  const logout = async () => {
    await axios.post("/api/auth/logout", {}, { withCredentials: true });
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsNewUser(false);
  };

  const clearNewUserFlag = (): void => {
    setIsNewUser(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
        isNewUser,
        clearNewUserFlag,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
