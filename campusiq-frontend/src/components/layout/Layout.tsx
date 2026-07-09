import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ChatbotWidget from './ChatbotWidget';
import { useTheme } from '../../context/ThemeContext';

const Layout = () => {
  const { darkMode } = useTheme();
  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: darkMode
        ? 'radial-gradient(circle at top right, rgba(20, 184, 166, 0.12), transparent 30%), #0f172a'
        : 'radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 28%), linear-gradient(135deg, #f8fafc 0%, #eef9f6 100%)'
    }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Navbar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          <Outlet />
        </main>
      </div>
      <ChatbotWidget />
    </div>
  );
};

export default Layout;
