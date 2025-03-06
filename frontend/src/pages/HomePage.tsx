import React from 'react';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
      <h1 className="text-5xl font-bold mb-4">Bienvenido a MarketingCRM</h1>
      <p className="text-xl text-center mb-8">
        La solución definitiva para gestionar tus pedidos de marketing de manera eficiente.
      </p>
      {user ? (
        <>
          <p className="text-lg mb-4">Hola, {user.email}</p>
          <button 
            className="bg-white text-indigo-600 py-2 px-6 rounded-lg shadow-md hover:bg-gray-200 transition"
            onClick={logout}
          >
            Cerrar sesión
          </button>
        </>
      ) : (
        <button 
          className="bg-white text-indigo-600 py-2 px-6 rounded-lg shadow-md hover:bg-gray-200 transition"
          onClick={() => window.location.href = '/home'}
        >
          ¡Comienza ahora!
        </button>
      )}
    </div>
  );
};

export default HomePage;
