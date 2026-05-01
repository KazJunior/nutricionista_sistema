import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Logo } from './ui/Layout';

const Sidebar = ({ isOpen, onClose }) => {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao sair:', error.message);
    }
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <Logo />
        </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/pacientes"
          className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
        >
          <Users size={20} />
          <span>Pacientes</span>
        </NavLink>
        <NavLink
          to="/agenda"
          className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
        >
          <Calendar size={20} />
          <span>Agenda da Semana</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button 
          onClick={toggleTheme} 
          className="nav-item" 
          style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', marginBottom: '0.5rem' }}
          title={theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          <span>{theme === 'light' ? 'Tema Escuro' : 'Tema Claro'}</span>
        </button>
        <button onClick={handleLogout} className="nav-item" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
      </aside>
    </>
  );
};

export default Sidebar;
