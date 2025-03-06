import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

interface ProtectedRouteProps {
  children: React.ReactNode;
  showNavbar?: boolean;
}

const ProtectedRoute = ({ children, showNavbar = true }: ProtectedRouteProps) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  );
};

export default ProtectedRoute;
