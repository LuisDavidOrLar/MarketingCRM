import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-[#0087d8] text-white shadow-md p-4 flex justify-between items-center">
      {/* Logo */}
      <Link to="/dashboard" className="text-2xl font-bold">
        MarketingCRM
      </Link>

      {/* Navegación */}
      <div className="flex items-center space-x-6">
        {user?.role === 'admin' ? (
          <>
            <button
              onClick={handleLogout}
              className="hover:text-gray-200 transition"
            >
              Cerrar Sesión
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="bg-white text-[#0087d8] py-2 px-4 rounded-lg shadow-md hover:bg-gray-100 transition"
            >
              Revisar Pedidos
            </button>
          </>
        ) : (
          <>
            <Link to="/my-requests" className="hover:text-gray-200 transition">
              Mis Pedidos
            </Link>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="hover:text-gray-200 transition"
              >
                Perfil
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded-lg shadow-lg">
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Mi Perfil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/request')}
              className="bg-white text-[#0087d8] py-2 px-4 rounded-lg shadow-md hover:bg-gray-100 transition"
            >
              Hacer un Pedido
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
