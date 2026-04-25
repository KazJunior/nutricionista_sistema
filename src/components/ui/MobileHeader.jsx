import { Menu, X, Sun, Moon } from 'lucide-react';
import { Logo } from './Layout';
import { useTheme } from '../../contexts/ThemeContext';

const MobileHeader = ({ isOpen, toggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mobile-header">
      <Logo />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={toggleTheme} className="mobile-toggle" title="Alternar tema">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <button onClick={toggleSidebar} className="mobile-toggle">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 4rem;
          background-color: var(--white);
          border-bottom: 1px solid var(--border-color);
          padding: 0 1rem;
          align-items: center;
          justify-content: space-between;
          z-index: 110;
        }

        .mobile-toggle {
          background: none;
          border: none;
          color: var(--gray-600);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: background-color 0.2s;
        }

        .mobile-toggle:hover {
          background-color: var(--gray-100);
        }

        @media (max-width: 1024px) {
          .mobile-header {
            display: flex;
          }
        }
      `}} />
    </div>
  );
};

export default MobileHeader;
