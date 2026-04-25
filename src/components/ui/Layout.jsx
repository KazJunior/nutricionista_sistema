import React from 'react';
import { Leaf } from 'lucide-react';

export const Logo = () => (
  <div className="logo-container">
    <img 
      src="/logo.png" 
      alt="NutriCore Logo" 
      style={{ 
        width: '40px', 
        height: '40px', 
        objectFit: 'contain',
        borderRadius: '50%',
        backgroundColor: 'transparent'
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
