import React from 'react';
import { Leaf } from 'lucide-react';

export const Logo = () => (
  <div className="logo-container">
    <Leaf 
      size={32} 
      style={{ 
        color: 'var(--primary)',
        flexShrink: 0
      }} 
    />
    <span className="logo-text">NutriCore</span>
  </div>
);

const Layout = ({ children }) => {
  return (
    <div className="layout">
      {children}
    </div>
  );
};

export default Layout;
