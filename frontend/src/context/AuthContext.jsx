import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from "react";
import { supabase } from "../utils/supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("geopassword_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem("geopassword_user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    const { data, error } = await supabase.rpc("login", {
      p_username: username,
      p_password: password
    });

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Credenziali errate");

    const userData = { id: data[0].id, username: data[0].username };
    setUser(userData);
    sessionStorage.setItem("geopassword_user", JSON.stringify(userData));
    return userData;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem("geopassword_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve essere usato dentro AuthProvider");
  return ctx;
}
