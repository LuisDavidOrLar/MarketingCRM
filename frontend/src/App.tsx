import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import RequestService from './pages/RequestServices';
import MyRequests from './pages/MyRequests';
import Orders from './pages/Orders';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext'; 

const App: React.FC = () => {

  return (
      <Router>
        <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<Home />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute showNavbar={true}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/request" 
            element={
              <ProtectedRoute showNavbar={true}>
                <RequestService />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-requests" 
            element={
              <ProtectedRoute showNavbar={true}>
                <MyRequests/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orders" 
            element={
              <ProtectedRoute showNavbar={true}>
                <Orders/>
              </ProtectedRoute>
            } 
          />
        </Routes>
        </AuthProvider>
      </Router>
  );
};

export default App;

