import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface LoginFormProps {
  centered?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ centered = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const { user, login, register } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  interface UserData {
    role: string;
  }
  

  const handleLogin = async (e: React.FormEvent) => { 
    e.preventDefault();
    try {
      const userData: UserData = await login(email, password); // ✅ Obtener datos del usuario después del login
  
      if (userData?.role) {
        sessionStorage.setItem('role', userData.role); // ✅ Guardar el rol en sessionStorage
        navigate(userData.role === 'admin' ? '/orders' : '/dashboard'); // ✅ Redirección según el rol
      } else {
        navigate('/dashboard'); // ✅ Fallback en caso de que no haya `role`
      }
    } catch (error) {
      console.error('Failed to login:', error);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userData: UserData = await register(email, password, role); // ✅ Obtener datos del usuario después del registro
  
      if (userData?.role) {
        sessionStorage.setItem('role', userData.role); // ✅ Guardar el rol en sessionStorage
        setIsOpen(false);
        navigate(userData.role === 'admin' ? '/orders' : '/dashboard'); // ✅ Redirección según el rol
      } else {
        navigate('/dashboard'); // ✅ Fallback en caso de que no haya `role`
      }
    } catch (error) {
      console.error('Failed to register:', error);
    }
  };

  if (user) {
    return (
      <div className="text-sm text-right mr-2 mt-2">
        {user.email}
      </div>
    );
  }

  return (
    <div className={`flex flex-col space-y-4 bg-white ${centered ? 'items-center' : ''}`}>
      <form onSubmit={handleLogin} className="flex flex-col space-y-4 w-full">
        <input
          id="email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm"
        />
        <input
          id="password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm"
        />
        <button type="submit" className="w-full px-4 py-2 bg-blue-500 text-white rounded shadow">
          Login
        </button>
      </form>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button
            className="w-full px-4 py-2 bg-gray-200 text-sm rounded shadow"
            onClick={() => setIsOpen(true)}
          >
            Register Now!
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle>Register</DialogTitle>
            <DialogDescription>
              Create a new account. It's quick and easy.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegister} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <select
                id="role"
                onChange={(e) => setRole(e.target.value)}
                className="col-span-3"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <DialogFooter>
              <button type="submit" className="btn w-full">Register</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginForm;
