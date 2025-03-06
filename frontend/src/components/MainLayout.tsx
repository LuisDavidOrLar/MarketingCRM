import React, { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="app-container flex items-center justify-center min-h-screen bg-gray-100">
      <main className="content flex-1 p-8 bg-white rounded shadow-md w-full max-w-md text-center">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
