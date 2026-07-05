import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Auth/Login';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import ComplaintList from './pages/Complaints/ComplaintList';
import RaiseComplaint from './pages/Complaints/RaiseComplaint';
import AssignComplaint from './pages/Complaints/AssignComplaint';
import TrackComplaint from './pages/Complaints/TrackComplaint';
import Workers from './pages/Workers/Workers';
import Masters from './pages/Masters/Masters';
import Assets from './pages/Assets/Assets';
import Attendance from './pages/HRMS/Attendance';
import Bookings from './pages/Bookings/Bookings';
import Notices from './pages/Notices/Notices';
import Chatbot from './pages/Chatbot/Chatbot';
import NetworkFault from './pages/NetworkFault/NetworkFault';
import QRCode from './pages/QRCode/QRCode';
import Feedback from './pages/Feedback/Feedback';
import RoleGuard from './components/common/RoleGuard';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="complaints" element={<ComplaintList />} />
        <Route path="complaints/raise" element={
          <RoleGuard allowedRoles={['user']}>
            <RaiseComplaint />
          </RoleGuard>
        } />
        <Route path="complaints/assign" element={
          <RoleGuard allowedRoles={['super_admin', 'admin']}>
            <AssignComplaint />
          </RoleGuard>
        } />
        <Route path="complaints/track" element={<TrackComplaint />} />
        <Route path="workers" element={
          <RoleGuard allowedRoles={['super_admin', 'admin']}>
            <Workers />
          </RoleGuard>
        } />
        <Route path="masters" element={
          <RoleGuard allowedRoles={['super_admin']}>
            <Masters />
          </RoleGuard>
        } />
        <Route path="assets" element={
          <RoleGuard allowedRoles={['super_admin', 'admin']}>
            <Assets />
          </RoleGuard>
        } />
        <Route path="bookings" element={<Bookings />} />
        <Route path="notices" element={<Notices />} />
        <Route path="chatbot" element={<Chatbot />} />
        <Route path="network-fault" element={
          <RoleGuard allowedRoles={['super_admin', 'admin']}>
            <NetworkFault />
          </RoleGuard>
        } />
        <Route path="qrcode" element={<QRCode />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="attendance" element={<Attendance />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ToastContainer position="top-right" />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;