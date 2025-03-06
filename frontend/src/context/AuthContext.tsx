import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from '../api';
import { useNavigate } from 'react-router-dom';

interface User {
  email: string;
  role: string; 
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>; // ✅ Devuelve `User`
  logout: () => void;
  register: (email: string, password: string, role: string) => Promise<User>; // ✅ Devuelve `User`
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const response = await axios.post('/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { sub, role } = parseJwt(response.data.access_token);
      const user: User = { email: sub, role };
      setUser(user);
      sessionStorage.setItem('token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      return user; // ✅ Retorna los datos del usuario
    } catch (error) {
      console.error('Failed to login:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    navigate('/');
  };

  const register = async (email: string, password: string, role: string) => {
    try {
      const response = await axios.post('/register', { email, password, role });
      const { sub, role: userRole } = parseJwt(response.data.access_token);
      const user: User = { email: sub, role: userRole };
      setUser(user);
      sessionStorage.setItem('token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      return user; // ✅ Retorna los datos del usuario
    } catch (error) {
      console.error('Failed to register:', error);
      throw error;
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      const { sub, role } = parseJwt(token);
      setUser({ email: sub, role });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

function parseJwt(token: string) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}
